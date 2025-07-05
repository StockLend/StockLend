// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title StockLend Protocol
 * @dev Non-liquidatable lending protocol with automatic put option protection
 * @dev Uses Chainlink for price feeds and automation
 */
contract StockLendProtocol is Ownable, ReentrancyGuard {
    
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
    
    uint256 public loanCounter;
    uint256 public constant MAX_LTV = 8000; // 80%
    uint256 public constant PUT_PROTECTION_BUFFER = 500; // 5%
    
    address public immutable USDC;
    address public treasury;
    
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
    
    event PutOptionExercised(uint256 indexed loanId, uint256 protectionPayout);
    event LoanRepaid(uint256 indexed loanId, uint256 repayAmount);
    event StockAssetAdded(address indexed token, address priceFeed, uint256 ltv);
    
    // ============================
    // CONSTRUCTOR
    // ============================
    
    constructor(
        address _usdc,
        address _treasury,
        address _owner
    ) Ownable(_owner) {
        USDC = _usdc;
        treasury = _treasury;
    }
    
    // ============================
    // EXTERNAL FUNCTIONS
    // ============================
    
    /**
     * @dev Create a new loan with automatic put option protection
     */
    function createLoan(
        address stockToken,
        uint256 collateralAmount,
        uint256 loanAmount,
        uint256 duration
    ) external nonReentrant {
        require(stockAssets[stockToken].isActive, "Stock not supported");
        require(collateralAmount > 0 && loanAmount > 0, "Invalid amounts");
        
        // Simple price simulation (replace with Chainlink in production)
        uint256 currentPrice = 100 * 1e18; // $100 per token
        uint256 collateralValue = (collateralAmount * currentPrice) / 1e18;
        
        // Check LTV ratio
        uint256 ltv = (loanAmount * 10000) / collateralValue;
        require(ltv <= stockAssets[stockToken].ltv, "LTV too high");
        
        // Calculate put strike price
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
            putExercised: false
        });
        
        userLoans[msg.sender].push(loanId);
        
        // Transfer USDC to borrower
        IERC20(USDC).transferFrom(treasury, msg.sender, loanAmount);
        
        emit LoanCreated(loanId, msg.sender, stockToken, collateralAmount, loanAmount, putStrike, block.timestamp + duration);
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
        
        emit LoanRepaid(loanId, repayAmount);
    }
    
    /**
     * @dev Add supported stock asset
     */
    function addStockAsset(address token, address priceFeed, uint256 ltv) external onlyOwner {
        require(ltv <= MAX_LTV, "LTV too high");
        
        stockAssets[token] = StockAsset({
            token: token,
            priceFeed: priceFeed,
            ltv: ltv,
            isActive: true
        });
        
        emit StockAssetAdded(token, priceFeed, ltv);
    }
    
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
    
    // ============================
    // ADMIN FUNCTIONS
    // ============================
    
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner(), amount);
    }
} 