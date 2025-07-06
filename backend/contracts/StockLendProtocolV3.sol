// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {BlackScholesLib} from "./libraries/BlackScholesLib.sol";

/**
 * @title StockLend Protocol V3
 * @dev Advanced lending protocol with Black-Scholes put option pricing
 * @dev Features:
 * - Dynamic strike calculation based on volatility
 * - USDC yield-based target returns (3.75% base APR)
 * - Optimized Black-Scholes for gas efficiency
 * - Enhanced lender protection with calculated premiums
 */
contract StockLendProtocolV3 is Ownable, ReentrancyGuard, AutomationCompatibleInterface {
    using BlackScholesLib for BlackScholesLib.BSParams;

    // ============================
    // STRUCTS
    // ============================

    struct LoanV3 {
        address borrower;
        address stockToken;
        uint256 collateralAmount;
        uint256 loanAmount;
        uint256 putStrike;
        uint256 putPremium;
        uint256 expiration;
        uint256 targetYield;
        uint256 protocolFee;
        bool isActive;
        bool putExercised;
        uint256 creationPrice;
        uint256 volatilityUsed;
    }

    struct StockAssetV3 {
        address token;
        address priceFeed;
        address volatilityFeed;
        uint256 ltv;
        bool isActive;
        bool useRealVolatility;
    }

    struct YieldCalculation {
        uint256 baseYield; // USDC base yield (3.75% = 37500000000000000)
        uint256 premiumYield; // Additional yield from put premium
        uint256 totalYield; // Total expected yield
        uint256 protocolFee; // Protocol fee (0.25%)
        uint256 reserveBuffer; // Risk reserve (0.5%)
    }

    struct CreateLoanData {
        uint256 currentPrice;
        uint256 volatility;
        uint256 optimalStrike;
        uint256 putPremium;
        uint256 baseYield;
        uint256 premiumYield;
        uint256 totalYield;
        uint256 protocolFee;
    }

    // ============================
    // STATE VARIABLES
    // ============================

    mapping(uint256 => LoanV3) public loans;
    mapping(address => StockAssetV3) public stockAssets;
    mapping(address => uint256[]) public userLoans;

    uint256[] public activeLoans;
    mapping(uint256 => uint256) public loanToIndex;

    uint256 public loanCounter;
    uint256 public constant MAX_LTV = 8000; // 80%
    uint256 public constant PRICE_DECIMALS = 8;

    // Yield parameters (18 decimals)
    uint256 public constant BASE_USDC_YIELD = 37500000000000000; // 3.75%
    uint256 public constant PROTOCOL_FEE_RATE = 2500000000000000; // 0.25%
    uint256 public constant RESERVE_BUFFER_RATE = 5000000000000000; // 0.5%

    // Generic formula parameters
    uint256 public constant PREMIUM_RATE = 70000000000000000; // 7% APR as specified by user
    uint256 public constant SAFETY_BUFFER = 50000000; // 0.5$ in 8 decimals (ε)

    address public immutable USDC;
    address public treasury;
    address public forwarder;

    uint256 public protectionFund;
    uint256 public protocolFeeCollected;

    // ============================
    // EVENTS
    // ============================

    event LoanV3Created(
        uint256 indexed loanId,
        address indexed borrower,
        address stockToken,
        uint256 collateralAmount,
        uint256 loanAmount,
        uint256 putStrike,
        uint256 putPremium,
        uint256 targetYield,
        uint256 expiration
    );

    event PutOptionExercisedV3(
        uint256 indexed loanId, uint256 protectionPayout, uint256 currentPrice, uint256 putStrike, uint256 premiumUsed
    );

    event YieldCalculated(
        uint256 indexed loanId, uint256 baseYield, uint256 premiumYield, uint256 totalYield, uint256 protocolFee
    );

    event VolatilityUpdated(address indexed token, uint256 newVolatility);

    // ============================
    // CONSTRUCTOR
    // ============================

    constructor(address _usdc, address _treasury, address _owner) Ownable(_owner) {
        USDC = _usdc;
        treasury = _treasury;
    }

    // ============================
    // MAIN FUNCTIONS
    // ============================

    /**
     * @dev Create optimized loan with Black-Scholes put pricing
     */
    function createLoanV3(address stockToken, uint256 collateralAmount, uint256 loanAmount, uint256 duration)
        external
        nonReentrant
    {
        require(stockAssets[stockToken].isActive, "Stock not supported");
        require(collateralAmount > 0 && loanAmount > 0, "Invalid amounts");
        require(duration >= 7 days && duration <= 365 days, "Invalid duration");

        // Pack data to avoid stack too deep
        CreateLoanData memory data = _prepareLoanData(stockToken, collateralAmount, loanAmount, duration);

        // Transfer collateral
        IERC20(stockToken).transferFrom(msg.sender, address(this), collateralAmount);

        // Create loan
        uint256 loanId = loanCounter++;
        loans[loanId] = LoanV3({
            borrower: msg.sender,
            stockToken: stockToken,
            collateralAmount: collateralAmount,
            loanAmount: loanAmount,
            putStrike: data.optimalStrike,
            putPremium: data.putPremium,
            expiration: block.timestamp + duration,
            targetYield: data.totalYield,
            protocolFee: data.protocolFee,
            isActive: true,
            putExercised: false,
            creationPrice: data.currentPrice,
            volatilityUsed: data.volatility
        });

        userLoans[msg.sender].push(loanId);
        loanToIndex[loanId] = activeLoans.length;
        activeLoans.push(loanId);

        // Transfer USDC to borrower
        IERC20(USDC).transfer(msg.sender, loanAmount);

        // Collect protocol fee
        protocolFeeCollected += data.protocolFee;

        emit LoanV3Created(
            loanId,
            msg.sender,
            stockToken,
            collateralAmount,
            loanAmount,
            data.optimalStrike,
            data.putPremium,
            data.totalYield,
            block.timestamp + duration
        );

        emit YieldCalculated(loanId, data.baseYield, data.premiumYield, data.totalYield, data.protocolFee);
    }

    /**
     * @dev Repay loan with calculated interest
     */
    function repayLoanV3(uint256 loanId) external nonReentrant {
        LoanV3 storage loan = loans[loanId];
        require(loan.isActive, "Loan not active");
        require(loan.borrower == msg.sender, "Not borrower");

        // Calculate repayment amount based on target yield
        uint256 repayAmount = loan.loanAmount + loan.targetYield;

        // Transfer repayment
        IERC20(USDC).transferFrom(msg.sender, address(this), repayAmount);

        // Return collateral
        IERC20(loan.stockToken).transfer(msg.sender, loan.collateralAmount);

        loan.isActive = false;
        _removeFromActiveLoans(loanId);

        emit LoanRepaid(loanId, repayAmount);
    }

    /**
     * @dev Get loan premium and yield info
     */
    function getLoanDetails(uint256 loanId)
        external
        view
        returns (LoanV3 memory loan, uint256 currentPrice, uint256 intrinsicValue, bool shouldExercise)
    {
        loan = loans[loanId];
        currentPrice = _getLatestPrice(loan.stockToken);
        intrinsicValue = loan.putStrike > currentPrice
            ? (loan.putStrike - currentPrice) * loan.collateralAmount / (10 ** PRICE_DECIMALS)
            : 0;
        shouldExercise = _shouldExercisePut(loanId);
    }

    /**
     * @dev Calculate put premium for any parameters (view function)
     */
    function calculatePutPremium(uint256 spot, uint256 strike, uint256 timeToMaturity, uint256 volatility)
        external
        pure
        returns (uint256)
    {
        BlackScholesLib.BSParams memory params = BlackScholesLib.BSParams({
            spot: spot,
            strike: strike,
            timeToMaturity: timeToMaturity,
            riskFreeRate: BASE_USDC_YIELD,
            volatility: volatility
        });

        BlackScholesLib.BSResult memory result = BlackScholesLib.calculatePutPremiumHybrid(params);
        return result.putPremium;
    }

    /**
     * @dev Calculate optimal strike using generic formula (view function)
     * @param loanAmount L - Loan amount in USDC (18 decimals)
     * @param duration Duration in seconds
     * @param currentPrice S - Current price (8 decimals)
     * @param volatility σ - Volatility (18 decimals)
     * @return budgetPrime Budget prime calculation
     * @return yieldLoan Yield loan calculation
     * @return protocolFees Protocol fees calculation
     * @return buffer Buffer amount
     * @return primeBudget Prime budget total
     * @return optimalStrike Optimal strike price
     */
    function calculateGenericFormula(uint256 loanAmount, uint256 duration, uint256 currentPrice, uint256 volatility)
        external
        pure
        returns (
            uint256 budgetPrime,
            uint256 yieldLoan,
            uint256 protocolFees,
            uint256 buffer,
            uint256 primeBudget,
            uint256 optimalStrike
        )
    {
        uint256 timeToMaturity = (duration * 1e18) / 365 days;

        // 1. Budget prime = L × premiumRate × T
        budgetPrime = (loanAmount * PREMIUM_RATE * timeToMaturity) / (1e18 * 1e18);

        // 2. Yield prêt = L × deltaAPY × T
        yieldLoan = (loanAmount * BASE_USDC_YIELD * timeToMaturity) / (1e18 * 1e18);

        // 3. Frais protocole = L × psi × T
        protocolFees = (loanAmount * PROTOCOL_FEE_RATE * timeToMaturity) / (1e18 * 1e18);

        // 4. Buffer ε
        buffer = SAFETY_BUFFER;

        // 5. Prime disponible = δ + ψ + ε
        primeBudget = yieldLoan + protocolFees + (buffer * 1e10); // Convert to 18 decimals

        // 6. Calculate optimal strike
        optimalStrike = BlackScholesLib.calculateOptimalStrikeGeneric(
            currentPrice,
            loanAmount,
            timeToMaturity,
            volatility,
            PREMIUM_RATE,
            BASE_USDC_YIELD,
            PROTOCOL_FEE_RATE,
            SAFETY_BUFFER
        );
    }

    /**
     * @dev Get detailed loan calculation preview
     * @param stockToken Stock token address
     * @param loanAmount Loan amount in USDC (18 decimals)
     * @param duration Duration in seconds
     * @return currentPrice Current price of the stock
     * @return volatility Volatility of the stock
     * @return budgetPrime Budget prime calculation
     * @return yieldLoan Yield loan calculation
     * @return protocolFees Protocol fees calculation
     * @return primeBudget Prime budget total
     * @return optimalStrike Optimal strike price
     * @return actualPremium Actual premium at optimal strike
     * @return totalYield Total yield for the loan
     */
    function previewLoanCalculation(address stockToken, uint256 loanAmount, uint256 duration)
        external
        view
        returns (
            uint256 currentPrice,
            uint256 volatility,
            uint256 budgetPrime,
            uint256 yieldLoan,
            uint256 protocolFees,
            uint256 primeBudget,
            uint256 optimalStrike,
            uint256 actualPremium,
            uint256 totalYield
        )
    {
        currentPrice = _getLatestPrice(stockToken);
        volatility = _getVolatility(stockToken);

        (budgetPrime, yieldLoan, protocolFees,, primeBudget, optimalStrike) =
            this.calculateGenericFormula(loanAmount, duration, currentPrice, volatility);

        // Calculate actual premium with optimal strike using production Black-Scholes
        actualPremium = this.calculatePutPremium(currentPrice, optimalStrike, (duration * 1e18) / 365 days, volatility);

        totalYield = yieldLoan + budgetPrime;
    }

    /**
     * @dev Manual put option exercise (for testing and emergency cases)
     */
    function exercisePutOption(uint256 loanId) external nonReentrant {
        require(_shouldExercisePut(loanId), "Put option conditions not met");
        _exercisePutOptionV3(loanId);
    }

    /**
     * @dev Get latest price for a stock token (public version for demo)
     */
    function getLatestPrice(address stockToken) external view returns (uint256) {
        return _getLatestPrice(stockToken);
    }

    /**
     * @dev Get volatility for a stock token (public version for demo)
     */
    function getVolatility(address stockToken) external view returns (uint256) {
        return _getVolatility(stockToken);
    }

    /**
     * @dev Check if put option should be exercised (public version for demo)
     */
    function shouldExercisePut(uint256 loanId) external view returns (bool) {
        return _shouldExercisePut(loanId);
    }

    // ============================
    // CHAINLINK AUTOMATION
    // ============================

    function checkUpkeep(bytes calldata /* checkData */ )
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        uint256[] memory loansToExercise = new uint256[](activeLoans.length);
        uint256 count = 0;

        // Limit gas usage by checking max 50 loans per call
        uint256 maxLoansToCheck = activeLoans.length > 50 ? 50 : activeLoans.length;

        for (uint256 i = 0; i < maxLoansToCheck; i++) {
            uint256 loanId = activeLoans[i];

            // Additional safety checks
            if (loans[loanId].isActive && !loans[loanId].putExercised && _shouldExercisePut(loanId)) {
                loansToExercise[count] = loanId;
                count++;

                // Limit to 10 exercises per automation call to prevent gas issues
                if (count >= 10) break;
            }
        }

        if (count > 0) {
            uint256[] memory finalLoans = new uint256[](count);
            for (uint256 i = 0; i < count; i++) {
                finalLoans[i] = loansToExercise[i];
            }
            upkeepNeeded = true;
            performData = abi.encode(finalLoans);
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        // Allow both forwarder and owner for flexibility
        require(msg.sender == forwarder || msg.sender == owner(), "Only forwarder or owner");

        uint256[] memory loansToExercise = abi.decode(performData, (uint256[]));
        require(loansToExercise.length > 0, "No loans to exercise");
        require(loansToExercise.length <= 10, "Too many loans per call");

        uint256 successfulExercises = 0;

        for (uint256 i = 0; i < loansToExercise.length; i++) {
            uint256 loanId = loansToExercise[i];

            // Verify conditions before exercise
            if (loans[loanId].isActive && !loans[loanId].putExercised && _shouldExercisePut(loanId)) {
                try this._exercisePutOptionV3Internal(loanId) {
                    successfulExercises++;
                    emit AutomationPutExercised(loanId, true, "Success");
                } catch Error(string memory reason) {
                    emit AutomationPutExercised(loanId, false, reason);
                } catch {
                    emit AutomationPutExercised(loanId, false, "Unknown error");
                }
            } else {
                emit AutomationPutExercised(loanId, false, "Conditions not met");
            }
        }

        emit AutomationUpkeepPerformed(loansToExercise.length, successfulExercises);
    }

    /**
     * @dev External wrapper for _exercisePutOptionV3 to enable try-catch
     */
    function _exercisePutOptionV3Internal(uint256 loanId) external {
        require(msg.sender == address(this), "Internal only");
        _exercisePutOptionV3(loanId);
    }

    /**
     * @dev Emergency automation override (owner only)
     */
    function emergencyExercisePut(uint256 loanId) external onlyOwner {
        require(_shouldExercisePut(loanId), "Put conditions not met");
        _exercisePutOptionV3(loanId);
        emit EmergencyPutExercised(loanId);
    }

    /**
     * @dev Bulk emergency exercise (owner only)
     */
    function emergencyBulkExercise(uint256[] calldata loanIds) external onlyOwner {
        for (uint256 i = 0; i < loanIds.length; i++) {
            if (_shouldExercisePut(loanIds[i])) {
                _exercisePutOptionV3(loanIds[i]);
                emit EmergencyPutExercised(loanIds[i]);
            }
        }
    }

    /**
     * @dev Get automation status for dashboard
     */
    function getAutomationStatus()
        external
        view
        returns (
            uint256 totalActiveLoans,
            uint256 loansNeedingExercise,
            uint256 protectionFundBalance,
            address currentForwarder
        )
    {
        totalActiveLoans = activeLoans.length;
        currentForwarder = forwarder;
        protectionFundBalance = protectionFund;

        // Count loans needing exercise
        for (uint256 i = 0; i < activeLoans.length; i++) {
            if (_shouldExercisePut(activeLoans[i])) {
                loansNeedingExercise++;
            }
        }
    }

    /**
     * @dev Test automation readiness
     */
    function testAutomationReadiness() external view returns (bool ready, string memory status) {
        if (forwarder == address(0)) {
            return (false, "Forwarder not set");
        }
        if (protectionFund == 0) {
            return (false, "Protection fund empty");
        }
        if (activeLoans.length == 0) {
            return (false, "No active loans");
        }
        return (true, "Automation ready");
    }

    // ============================
    // ADMIN FUNCTIONS
    // ============================

    /**
     * @dev Add stock asset with optional volatility feed
     */
    function addStockAssetV3(
        address token,
        address priceFeed,
        address volatilityFeed,
        uint256 ltv,
        bool useRealVolatility
    ) external onlyOwner {
        require(ltv <= MAX_LTV, "LTV too high");

        stockAssets[token] = StockAssetV3({
            token: token,
            priceFeed: priceFeed,
            volatilityFeed: volatilityFeed,
            ltv: ltv,
            isActive: true,
            useRealVolatility: useRealVolatility
        });

        emit StockAssetAdded(token, priceFeed, ltv);
    }

    function setForwarder(address _forwarder) external onlyOwner {
        forwarder = _forwarder;
    }

    function depositProtectionFund(uint256 amount) external {
        IERC20(USDC).transferFrom(msg.sender, address(this), amount);
        protectionFund += amount;
    }

    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFeeCollected;
        protocolFeeCollected = 0;
        IERC20(USDC).transfer(owner(), amount);
    }

    // ============================
    // INTERNAL FUNCTIONS
    // ============================

    function _prepareLoanData(address stockToken, uint256 collateralAmount, uint256 loanAmount, uint256 duration)
        internal
        view
        returns (CreateLoanData memory)
    {
        StockAssetV3 memory asset = stockAssets[stockToken];

        // Get market data
        uint256 currentPrice = _getLatestPrice(stockToken);
        uint256 volatility = _getVolatility(stockToken);
        uint256 collateralValue = (collateralAmount * currentPrice) / (10 ** PRICE_DECIMALS);

        // Check LTV
        uint256 ltv = (loanAmount * 10000) / collateralValue;
        require(ltv <= asset.ltv, "LTV too high");

        // Calculate using generic formula approach
        uint256 timeToMaturity = (duration * 1e18) / 365 days;

        // Calculate optimal strike using generic formula
        uint256 optimalStrike = BlackScholesLib.calculateOptimalStrikeGeneric(
            currentPrice,
            loanAmount,
            timeToMaturity,
            volatility,
            PREMIUM_RATE,
            BASE_USDC_YIELD,
            PROTOCOL_FEE_RATE,
            SAFETY_BUFFER
        );

        // Calculate actual premium with optimal strike
        BlackScholesLib.BSParams memory bsParams = BlackScholesLib.BSParams({
            spot: currentPrice,
            strike: optimalStrike,
            timeToMaturity: timeToMaturity,
            riskFreeRate: BASE_USDC_YIELD,
            volatility: volatility
        });

        BlackScholesLib.BSResult memory bsResult = BlackScholesLib.calculatePutPremiumHybrid(bsParams);

        // Calculate yield components using generic formula
        uint256 baseYield = (loanAmount * BASE_USDC_YIELD * timeToMaturity) / (1e36);
        uint256 protocolFee = (loanAmount * PROTOCOL_FEE_RATE * timeToMaturity) / (1e36);
        uint256 budgetPrime = (loanAmount * PREMIUM_RATE * timeToMaturity) / (1e36);

        return CreateLoanData({
            currentPrice: currentPrice,
            volatility: volatility,
            optimalStrike: optimalStrike,
            putPremium: bsResult.putPremium,
            baseYield: baseYield,
            premiumYield: budgetPrime,
            totalYield: baseYield + budgetPrime,
            protocolFee: protocolFee
        });
    }

    function _calculateYield(uint256 loanAmount, uint256 duration) internal pure returns (YieldCalculation memory) {
        // Base yield = loan amount * base rate * time
        uint256 timeInYears = (duration * 1e18) / 365 days;
        uint256 baseYield = (loanAmount * BASE_USDC_YIELD * timeInYears) / 1e36;

        // Premium yield = 7% APR as specified by user
        uint256 premiumYield = (loanAmount * PREMIUM_RATE * timeInYears) / 1e36;

        // Protocol fee = 0.25% of loan amount
        uint256 protocolFee = (loanAmount * PROTOCOL_FEE_RATE * timeInYears) / 1e36;

        // Reserve buffer = 0.5% of loan amount
        uint256 reserveBuffer = (loanAmount * RESERVE_BUFFER_RATE * timeInYears) / 1e36;

        return YieldCalculation({
            baseYield: baseYield,
            premiumYield: premiumYield,
            totalYield: baseYield + premiumYield,
            protocolFee: protocolFee,
            reserveBuffer: reserveBuffer
        });
    }

    function _getLatestPrice(address stockToken) internal view returns (uint256) {
        StockAssetV3 memory asset = stockAssets[stockToken];
        require(asset.isActive, "Asset not supported");

        if (asset.priceFeed == address(0)) {
            return 100 * (10 ** PRICE_DECIMALS); // Mock price
        }

        AggregatorV3Interface priceFeed = AggregatorV3Interface(asset.priceFeed);
        (, int256 price,, uint256 timeStamp,) = priceFeed.latestRoundData();

        require(timeStamp > 0, "Round not complete");
        require(price > 0, "Invalid price");

        return uint256(price);
    }

    function _getVolatility(address stockToken) internal view returns (uint256) {
        StockAssetV3 memory asset = stockAssets[stockToken];

        if (!asset.useRealVolatility || asset.volatilityFeed == address(0)) {
            // Default volatility for tech stocks (30%)
            return 300000000000000000; // 0.3 * 1e18
        }

        AggregatorV3Interface volatilityFeed = AggregatorV3Interface(asset.volatilityFeed);
        (, int256 vol,, uint256 timeStamp,) = volatilityFeed.latestRoundData();

        require(timeStamp > 0, "Round not complete");
        require(vol > 0, "Invalid volatility");

        return uint256(vol);
    }

    function _shouldExercisePut(uint256 loanId) internal view returns (bool) {
        LoanV3 memory loan = loans[loanId];
        if (!loan.isActive || loan.putExercised) return false;

        uint256 currentPrice = _getLatestPrice(loan.stockToken);
        return currentPrice < loan.putStrike;
    }

    function _exercisePutOptionV3(uint256 loanId) internal {
        LoanV3 storage loan = loans[loanId];
        require(loan.isActive && !loan.putExercised, "Cannot exercise");

        uint256 currentPrice = _getLatestPrice(loan.stockToken);
        require(currentPrice < loan.putStrike, "Price above strike");

        // Calculate payout using premium
        uint256 priceDrop = loan.putStrike - currentPrice;
        uint256 intrinsicValue = (loan.collateralAmount * priceDrop) / (10 ** PRICE_DECIMALS);
        uint256 protectionPayout = intrinsicValue > loan.putPremium ? loan.putPremium : intrinsicValue;

        require(protectionFund >= protectionPayout, "Insufficient protection fund");

        loan.putExercised = true;
        protectionFund -= protectionPayout;

        // Pay protection to treasury
        IERC20(USDC).transfer(treasury, protectionPayout);

        emit PutOptionExercisedV3(loanId, protectionPayout, currentPrice, loan.putStrike, loan.putPremium);
    }

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
    // VIEW FUNCTIONS
    // ============================

    function getUserLoans(address user) external view returns (uint256[] memory) {
        return userLoans[user];
    }

    function getActiveLoansCount() external view returns (uint256) {
        return activeLoans.length;
    }

    function getProtocolStats()
        external
        view
        returns (
            uint256 totalProtectionFund,
            uint256 totalProtocolFees,
            uint256 totalActiveLoans,
            uint256 baseYieldRate
        )
    {
        return (protectionFund, protocolFeeCollected, activeLoans.length, BASE_USDC_YIELD);
    }

    // Events from parent contracts
    event LoanRepaid(uint256 indexed loanId, uint256 repayAmount);
    event StockAssetAdded(address indexed token, address priceFeed, uint256 ltv);
    event AutomationPutExercised(uint256 indexed loanId, bool success, string reason);
    event AutomationUpkeepPerformed(uint256 totalLoansChecked, uint256 successfulExercises);
    event EmergencyPutExercised(uint256 indexed loanId);
}
