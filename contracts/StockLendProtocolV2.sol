// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

/**
 * @title StockLend Protocol V2
 * @dev Non-liquidatable lending protocol with automatic put option protection via Chainlink Automation
 * @dev Uses Chainlink for price feeds and automated put option triggering
 */
contract StockLendProtocolV2 is Ownable, ReentrancyGuard, AutomationCompatibleInterface {
    // ============================
    // STRUCTS
    // ============================

    struct Loan {
        address borrower;
        address stockToken;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 putStrike;
        uint256 expiration;
        uint256 interestRate;
        bool isActive;
        bool putExercised;
        uint256 creationPrice; // Price at loan creation
    }

    struct StockAsset {
        address token;
        address priceFeed;
        uint256 ltv; // Loan to Value ratio (basis points)
        bool isActive;
    }

    // ============================
    // STATE VARIABLES
    // ============================

    mapping(uint256 => Loan) public loans;
    mapping(address => StockAsset) public stockAssets;
    mapping(address => uint256[]) public userLoans;

    // Active loans array for automation monitoring
    uint256[] public activeLoans;
    mapping(uint256 => uint256) public loanToIndex; // loan ID to activeLoans index

    uint256 public loanCounter;
    uint256 public constant MAX_LTV = 8000; // 80%
    uint256 public constant PUT_PROTECTION_BUFFER = 500; // 5%
    uint256 public constant PRICE_DECIMALS = 8; // Chainlink price feed decimals

    address public immutable USDC;
    address public treasury;
    address public forwarder; // Chainlink Automation forwarder

    // Protection fund for put option payouts
    uint256 public protectionFund;

    // ============================
    // EVENTS
    // ============================

    event LoanCreated(
        uint256 indexed loanId,
        address indexed borrower,
        address stockToken,
        uint256 collateralAmount,
        uint256 loanAmount,
        uint256 putStrike,
        uint256 expiration
    );

    event PutOptionExercised(uint256 indexed loanId, uint256 protectionPayout, uint256 currentPrice, uint256 putStrike);

    event LoanRepaid(uint256 indexed loanId, uint256 repayAmount);
    event StockAssetAdded(address indexed token, address priceFeed, uint256 ltv);
    event ProtectionFundDeposited(uint256 amount);
    event ForwarderSet(address indexed forwarder);

    // ============================
    // MODIFIERS
    // ============================

    modifier onlyForwarder() {
        require(msg.sender == forwarder, "Only automation forwarder");
        _;
    }

    // ============================
    // CONSTRUCTOR
    // ============================

    constructor(address _usdc, address _treasury, address _owner) Ownable(_owner) {
        USDC = _usdc;
        treasury = _treasury;
    }

    // ============================
    // CHAINLINK AUTOMATION FUNCTIONS
    // ============================

    /**
     * @dev Chainlink Automation - Check if any loans need put option exercise
     */
    function checkUpkeep(bytes calldata /* checkData */ )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory loansToExercise = new uint256[](activeLoans.length);
        uint256 count = 0;

        for (uint256 i = 0; i < activeLoans.length; i++) {
            uint256 loanId = activeLoans[i];
            Loan memory loan = loans[loanId];

            if (loan.isActive && !loan.putExercised && _shouldExercisePut(loanId)) {
                loansToExercise[count] = loanId;
                count++;
            }
        }

        if (count > 0) {
            // Resize array to actual count
            uint256[] memory finalLoans = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                finalLoans[i] = loansToExercise[i];
            }

            upkeepNeeded = true;
            performData = abi.encode(finalLoans);
        }
    }

    /**
     * @dev Chainlink Automation - Execute put options for triggered loans
     */
    function performUpkeep(bytes calldata performData) external override onlyForwarder {
        uint256[] memory loansToExercise = abi.decode(performData, (uint256[]));

        for (uint256 i = 0; i < loansToExercise.length; i++) {
            _exercisePutOption(loansToExercise[i]);
        }
    }

    // ============================
    // EXTERNAL FUNCTIONS
    // ============================

    /**
     * @dev Create a new loan with automatic put option protection
     */
    function createLoan(address stockToken, uint256 collateralAmount, uint256 loanAmount, uint256 duration)
        external
        nonReentrant
    {
        require(stockAssets[stockToken].isActive, "Stock not supported");
        require(collateralAmount > 0 && loanAmount > 0, "Invalid amounts");

        // Get current price from Chainlink
        uint256 currentPrice = _getLatestPrice(stockToken);
        uint256 collateralValue = (collateralAmount * currentPrice) / (10 ** PRICE_DECIMALS);

        // Check LTV ratio
        uint256 ltv = (loanAmount * 10000) / collateralValue;
        require(ltv <= stockAssets[stockToken].ltv, "LTV too high");

        // Calculate put strike price (95% of current price)
        uint256 putStrike = (currentPrice * (10000 - PUT_PROTECTION_BUFFER)) / 10000;

        // Transfer collateral
        IERC20(stockToken).transferFrom(msg.sender, address(this), collateralAmount);

        // Create loan
        uint256 loanId = loanCounter++;
        loans[loanId] = Loan({
            borrower: msg.sender,
            stockToken: stockToken,
            collateralAmount: collateralAmount,
            loanAmount: loanAmount,
            putStrike: putStrike,
            expiration: block.timestamp + duration,
            interestRate: loanAmount * 1000 / 10000, // 10% simple interest
            isActive: true,
            putExercised: false,
            creationPrice: currentPrice
        });

        userLoans[msg.sender].push(loanId);

        // Add to active loans for monitoring
        loanToIndex[loanId] = activeLoans.length;
        activeLoans.push(loanId);

        // Transfer USDC to borrower
        IERC20(USDC).transferFrom(treasury, msg.sender, loanAmount);

        emit LoanCreated(
            loanId, msg.sender, stockToken, collateralAmount, loanAmount, putStrike, block.timestamp + duration
        );
    }

    /**
     * @dev Repay loan and get back collateral
     */
    function repayLoan(uint256 loanId) external nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");

        uint256 repayAmount = loan.loanAmount + loan.interestRate;

        // Transfer repayment
        IERC20(USDC).transferFrom(msg.sender, treasury, repayAmount);

        // Return collateral
        IERC20(loan.stockToken).transfer(msg.sender, loan.collateralAmount);

        loan.isActive = false;

        // Remove from active loans
        _removeFromActiveLoans(loanId);

        emit LoanRepaid(loanId, repayAmount);
    }

    /**
     * @dev Manually exercise put option (for testing or emergency)
     */
    function exercisePutOption(uint256 loanId) external {
        require(_shouldExercisePut(loanId), "Put conditions not met");
        _exercisePutOption(loanId);
    }

    /**
     * @dev Add supported stock asset with Chainlink price feed
     */
    function addStockAsset(address token, address priceFeed, uint256 ltv) external onlyOwner {
        require(ltv <= MAX_LTV, "LTV too high");
        // Allow zero address for mock/demo price feeds

        stockAssets[token] = StockAsset({token: token, priceFeed: priceFeed, ltv: ltv, isActive: true});

        emit StockAssetAdded(token, priceFeed, ltv);
    }

    /**
     * @dev Deposit funds to protection fund for put option payouts
     */
    function depositProtectionFund(uint256 amount) external {
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        protectionFund += amount;
        emit ProtectionFundDeposited(amount);
    }

    /**
     * @dev Set Chainlink Automation forwarder address
     */
    function setForwarder(address _forwarder) external onlyOwner {
        forwarder = _forwarder;
        emit ForwarderSet(_forwarder);
    }

    // ============================
    // VIEW FUNCTIONS
    // ============================

    /**
     * @dev Get user's loans
     */
    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    /**
     * @dev Get loan details
     */
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @dev Get current price for a stock token
     */
    function getCurrentPrice(address stockToken) external view returns (uint256) {
        return _getLatestPrice(stockToken);
    }

    /**
     * @dev Get active loans count
     */
    function getActiveLoansCount() external view returns (uint256) {
        return activeLoans.length;
    }

    /**
     * @dev Check if a loan should have its put option exercised
     */
    function shouldExercisePut(uint256 loanId) external view returns (bool) {
        return _shouldExercisePut(loanId);
    }

    // ============================
    // INTERNAL FUNCTIONS
    // ============================

    /**
     * @dev Get latest price from Chainlink price feed
     */
    function _getLatestPrice(address stockToken) internal view returns (uint256) {
        StockAsset memory asset = stockAssets[stockToken];
        require(asset.isActive, "Asset not supported");

        // For demo purposes, return mock price if no real price feed
        if (asset.priceFeed == address(0)) {
            return 100 * (10 ** PRICE_DECIMALS); // $100 mock price
        }

        AggregatorV3Interface priceFeed = AggregatorV3Interface(asset.priceFeed);
        (, int256 price,, uint256 timeStamp,) = priceFeed.latestRoundData();

        require(timeStamp > 0, "Round not complete");
        require(price > 0, "Invalid price");

        return uint256(price);
    }

    /**
     * @dev Check if put option should be exercised
     */
    function _shouldExercisePut(uint256 loanId) internal view returns (bool) {
        Loan memory loan = loans[loanId];

        if (!loan.isActive || loan.putExercised) {
            return false;
        }

        uint256 currentPrice = _getLatestPrice(loan.stockToken);
        return currentPrice < loan.putStrike;
    }

    /**
     * @dev Execute put option for a loan
     */
    function _exercisePutOption(uint256 loanId) internal {
        Loan storage loan = loans[loanId];
        require(loan.isActive && !loan.putExercised, "Cannot exercise put");

        uint256 currentPrice = _getLatestPrice(loan.stockToken);
        require(currentPrice < loan.putStrike, "Price above strike");

        // Calculate protection payout
        uint256 priceDrop = loan.putStrike - currentPrice;
        uint256 protectionPayout = (loan.collateralAmount * priceDrop) / (10 ** PRICE_DECIMALS);

        require(protectionFund >= protectionPayout, "Insufficient protection fund");

        // Mark as exercised
        loan.putExercised = true;

        // Pay protection to borrower
        protectionFund -= protectionPayout;
        IERC20(USDC).transfer(loan.borrower, protectionPayout);

        emit PutOptionExercised(loanId, protectionPayout, currentPrice, loan.putStrike);
    }

    /**
     * @dev Remove loan from active loans array
     */
    function _removeFromActiveLoans(uint256 loanId) internal {
        uint256 index = loanToIndex[loanId];
        uint256 lastIndex = activeLoans.length - 1;

        if (index != lastIndex) {
            uint256 lastLoanId = activeLoans[lastIndex];
            activeLoans[index] = lastLoanId;
            loanToIndex[lastLoanId] = index;
        }

        activeLoans.pop();
        delete loanToIndex[loanId];
    }

    // ============================
    // ADMIN FUNCTIONS
    // ============================

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }

    function withdrawProtectionFund(uint256 amount) external onlyOwner {
        require(amount <= protectionFund, "Insufficient funds");
        protectionFund -= amount;
        IERC20(USDC).transfer(owner(), amount);
    }
}
