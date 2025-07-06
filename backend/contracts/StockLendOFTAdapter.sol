// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OFTAdapter} from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";

/**
 * @title StockLendOFTAdapter
 * @dev OFT Adapter for cross-chain stock tokens in StockLend Protocol
 * @dev Enables stock tokens to be used as collateral across multiple chains
 */
contract StockLendOFTAdapter is OFTAdapter {
    // Stock metadata for cross-chain info
    string public stockSymbol;
    string public stockName;

    // Cross-chain collateral tracking
    mapping(uint32 => uint256) public collateralByChain;
    mapping(address => mapping(uint32 => uint256)) public userCollateralByChain;

    event CrossChainCollateralDeposited(address indexed user, uint32 indexed dstEid, uint256 amount);

    event CrossChainCollateralWithdrawn(address indexed user, uint32 indexed srcEid, uint256 amount);

    /**
     * @dev Constructor
     * @param _token Address of the stock token
     * @param _lzEndpoint LayerZero endpoint address
     * @param _delegate Owner/delegate address
     * @param _stockSymbol Stock symbol (e.g. "AAPL")
     * @param _stockName Stock name (e.g. "Apple Inc.")
     */
    constructor(
        address _token,
        address _lzEndpoint,
        address _delegate,
        string memory _stockSymbol,
        string memory _stockName
    ) OFTAdapter(_token, _lzEndpoint, _delegate) Ownable(_delegate) {
        stockSymbol = _stockSymbol;
        stockName = _stockName;
    }

    /**
     * @dev Override to track cross-chain collateral
     */
    function _debit(address _from, uint256 _amountLD, uint256 _minAmountLD, uint32 _dstEid)
        internal
        override
        returns (uint256 amountSentLD, uint256 amountReceivedLD)
    {
        (amountSentLD, amountReceivedLD) = super._debit(_from, _amountLD, _minAmountLD, _dstEid);

        // Track collateral movement
        collateralByChain[_dstEid] += amountSentLD;
        userCollateralByChain[_from][_dstEid] += amountSentLD;

        emit CrossChainCollateralDeposited(_from, _dstEid, amountSentLD);
    }

    /**
     * @dev Override to track cross-chain collateral returns
     */
    function _credit(address _to, uint256 _amountLD, uint32 _srcEid)
        internal
        override
        returns (uint256 amountReceivedLD)
    {
        amountReceivedLD = super._credit(_to, _amountLD, _srcEid);

        // Track collateral return
        collateralByChain[_srcEid] -= amountReceivedLD;
        userCollateralByChain[_to][_srcEid] -= amountReceivedLD;

        emit CrossChainCollateralWithdrawn(_to, _srcEid, amountReceivedLD);
    }

    /**
     * @dev Get total collateral on specific chain
     * @param chainId Chain ID
     * @return Total collateral amount
     */
    function getChainCollateral(uint32 chainId) external view returns (uint256) {
        return collateralByChain[chainId];
    }

    /**
     * @dev Get user's collateral on specific chain
     * @param user User address
     * @param chainId Chain ID
     * @return User's collateral amount
     */
    function getUserChainCollateral(address user, uint32 chainId) external view returns (uint256) {
        return userCollateralByChain[user][chainId];
    }

    /**
     * @dev Get stock information
     * @return stockSymbol, stockName
     */
    function getStockInfo() external view returns (string memory, string memory) {
        return (stockSymbol, stockName);
    }
}
