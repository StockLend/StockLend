// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StockToken
 * @dev ERC20 token representing Real World Assets (stocks)
 * @dev Used as collateral in StockLend Protocol
 */
contract StockToken is ERC20, Ownable {
    // Stock metadata
    string public stockSymbol;
    string public stockName;
    uint256 public totalMarketCap;

    // Minting controls
    mapping(address => bool) public authorizedMinters;

    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    event StockMinted(address indexed to, uint256 amount, string reason);

    /**
     * @dev Constructor
     * @param _name Token name (e.g. "Apple Inc. Stock Token")
     * @param _symbol Token symbol (e.g. "sAAPL")
     * @param _stockSymbol Real stock symbol (e.g. "AAPL")
     * @param _stockName Real stock name (e.g. "Apple Inc.")
     * @param _owner Initial owner
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _stockSymbol,
        string memory _stockName,
        address _owner
    ) ERC20(_name, _symbol) Ownable(_owner) {
        stockSymbol = _stockSymbol;
        stockName = _stockName;
    }

    /**
     * @dev Mint stock tokens (only authorized minters)
     * @param to Address to mint to
     * @param amount Amount to mint
     * @param reason Reason for minting
     */
    function mint(address to, uint256 amount, string memory reason) external {
        require(authorizedMinters[msg.sender], "Not authorized minter");
        _mint(to, amount);
        emit StockMinted(to, amount, reason);
    }

    /**
     * @dev Authorize a minter
     * @param minter Address to authorize
     */
    function authorizeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }

    /**
     * @dev Revoke minter authorization
     * @param minter Address to revoke
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }

    /**
     * @dev Update market cap for analytics
     * @param newMarketCap New market cap
     */
    function updateMarketCap(uint256 newMarketCap) external onlyOwner {
        totalMarketCap = newMarketCap;
    }

    /**
     * @dev Get stock info
     * @return stockSymbol, stockName, totalMarketCap
     */
    function getStockInfo() external view returns (string memory, string memory, uint256) {
        return (stockSymbol, stockName, totalMarketCap);
    }
}
