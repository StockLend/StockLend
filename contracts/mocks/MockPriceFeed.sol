// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockPriceFeed
 * @dev Controllable price feed for testing put option automation
 */
contract MockPriceFeed is AggregatorV3Interface {
    uint8 public constant override decimals = 8;
    string public constant override description = "Mock Price Feed";
    uint256 public constant override version = 1;

    int256 private _price;
    uint256 private _timestamp;
    uint80 private _roundId;

    event PriceUpdated(int256 newPrice, uint256 timestamp);

    constructor(int256 _initialPrice) {
        _price = _initialPrice;
        _timestamp = block.timestamp;
        _roundId = 1;
    }

    /**
     * @dev Update the price (for testing purposes)
     */
    function updatePrice(int256 _newPrice) external {
        _price = _newPrice;
        _timestamp = block.timestamp;
        _roundId++;
        emit PriceUpdated(_newPrice, _timestamp);
    }

    /**
     * @dev Chainlink interface implementation
     */
    function getRoundData(uint80 /* _roundId */ )
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (_roundId, _price, _timestamp, _timestamp, _roundId);
    }

    /**
     * @dev Get latest round data
     */
    function latestRoundData()
        external
        view
        override
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (_roundId, _price, _timestamp, _timestamp, _roundId);
    }
}
