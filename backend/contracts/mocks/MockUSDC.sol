// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token for testing purposes
 * @dev WARNING: This is for testing purposes only - has public mint function
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USD Coin", "USDC") {}

    /**
     * @dev Returns 6 decimals to match real USDC
     */
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @dev Public mint function for testing - allows anyone to mint tokens
     * @param _to Address to mint tokens to
     * @param _amount Amount to mint (in 6 decimal format)
     */
    function mint(address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }

    /**
     * @dev Convenient function to mint a specific USD amount
     * @param _to Address to mint tokens to
     * @param _usdAmount Amount in USD (will be converted to 6 decimals)
     */
    function mintUSD(address _to, uint256 _usdAmount) public {
        _mint(_to, _usdAmount * 10 ** 6);
    }
}
