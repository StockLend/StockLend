# 🏦 StockLend Protocol V3 - Advanced DeFi Lending with Black-Scholes Pricing

<p align="center">
  <img alt="StockLend Protocol" width="400" src="https://via.placeholder.com/400x100/1a73e8/ffffff?text=StockLend+Protocol+V3"/>
</p>

<p align="center">
  <strong>Revolutionary DeFi lending protocol with Black-Scholes put option pricing and automated risk protection</strong>
</p>

## 🌟 **Features**

- **🧮 Black-Scholes Put Pricing**: Mathematical precision for option valuation
- **🎯 Dynamic Strike Optimization**: Automated optimal strike calculation
- **💰 Enhanced Yields**: 67.7% better returns than traditional USDC lending
- **🛡️ Automated Risk Protection**: Put options protect lender capital
- **⚡ Gas Optimized**: Efficient on-chain calculations
- **🔄 Chainlink Integration**: Real-time price feeds and automation
- **🌉 Cross-Chain Ready**: LayerZero OFT integration for multi-chain deployment

## 📋 **Quick Start**

### Prerequisites

- Node.js (v16+)
- Hardhat environment
- Git

### ⚡ **Run Demo in 30 Seconds**

```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run the V3 Demo
npx hardhat run scripts/alicePutOptionDemo.ts
```

### 🎯 **What You'll See**

#### ✅ **Black-Scholes Calculation**

```
💎 Calculated Put Premium: 3.75 USDC
🎯 Put Strike: 198.75 USD (optimized automatically)
📈 Effective APY: 6.29% (+67.7% vs base USDC)
```

#### ✅ **Automated Put Option Protection**

```
🔥 PUT OPTION TRIGGERED!
🛡️ Protection paid to lender
💰 Lender capital protected
```

## 🏗️ **Architecture**

### Core Smart Contracts

- **`StockLendProtocolV3.sol`** - Main protocol with Black-Scholes pricing
- **`BlackScholesLib.sol`** - Mathematical library for option pricing
- **`MockPriceFeed.sol`** - Chainlink-compatible price feeds
- **`StockLendOFTAdapter.sol`** - Cross-chain token adapter

### Key Features

1. **🧮 Black-Scholes Implementation**: First DeFi protocol with true mathematical option pricing
2. **📊 Dynamic Yield Optimization**: Target returns based on market conditions
3. **🔄 Chainlink Automation**: Automated put option exercises
4. **🌉 Cross-Chain Support**: LayerZero OFT for multi-chain deployment
5. **🛡️ Risk Management**: Automated protection fund management

## 🚀 **Deployment**

### Local Development

```bash
# Start local hardhat node
npx hardhat node

# Deploy V3 Protocol
npx hardhat run deploy/StockLendProtocolV3.ts --network localhost
```

### Testnet Deployment

```bash
# Deploy to testnet
npx hardhat lz:deploy --tags StockLendProtocolV3 --networks sepolia

# Setup demo assets
npx hardhat run scripts/alicePutOptionDemo.ts --network sepolia
```

## 💡 **Protocol Mechanics**

### Loan Creation Process

1. **Collateral Deposit**: User deposits stock tokens (e.g., AAPL, TSLA)
2. **Black-Scholes Calculation**: Protocol calculates optimal put strike and premium
3. **Dynamic Pricing**: Strike price optimized for target yields
4. **USDC Lending**: User receives USDC loan with put option protection
5. **Automated Monitoring**: Chainlink automation monitors price conditions

### Yield Enhancement

- **Base USDC Yield**: 3.75% APR
- **Premium Enhancement**: Additional yield from put option premiums
- **Total Yield**: Typically 6-7% APR for lenders
- **Protection**: Put options protect against downside risk

## 🔧 **Configuration**

### Adding Stock Assets

```solidity
// Add supported stock with price feed
await protocolV3.addStockAssetV3(
    tokenAddress,
    priceFeedAddress,
    volatilityFeedAddress,
    ltv, // 7500 = 75%
    useRealVolatility
);
```

### Chainlink Automation Setup

```solidity
// Set automation forwarder
await protocolV3.setForwarder(forwarderAddress);

// Fund protection fund
await protocolV3.depositProtectionFund(amount);
```

## 📊 **Example Calculation**

```
📋 Loan Example:
- Collateral: 100 AAPL @ $200 = $20,000
- Loan Amount: $15,000 (75% LTV)
- Duration: 90 days
- Put Strike: $198.75 (dynamic calculation)
- Put Premium: $3.69 (Black-Scholes)
- Lender APY: 6.29% (vs 3.75% base)
```

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run specific test suites
npx hardhat test test/hardhat/StockLendProtocolV3.test.ts

# Run with coverage
npx hardhat coverage
```

## 🔗 **Cross-Chain Deployment**

This protocol includes LayerZero OFT integration for cross-chain functionality:

```bash
# Deploy OFT adapters
npx hardhat lz:deploy --tags MyOFTAdapter --networks optimism-testnet

# Wire cross-chain messaging
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts

# Send cross-chain tokens
npx hardhat lz:oft:send --src-eid 40232 --dst-eid 40231 --amount 1 --to <ADDRESS>
```

## 🔒 **Security Features**

- **Reentrancy Protection**: All external calls protected
- **Access Control**: Role-based permissions
- **Mathematical Validation**: Rigorous Black-Scholes implementation
- **Protection Fund**: Dedicated funds for put option payouts
- **Automated Monitoring**: Chainlink automation for risk management

## 🎯 **Use Cases**

1. **Enhanced USDC Lending**: Earn 67.7% more than traditional DeFi lending
2. **Stock Token Leveraging**: Unlock liquidity from stock token holdings
3. **Risk-Protected Lending**: Automated put option protection
4. **Cross-Chain Asset Management**: Multi-chain deployment capability

## 📈 **Roadmap**

### Phase 1: Production (Q1 2025)

- Real Chainlink volatility feeds
- Multi-asset support (TSLA, MSFT, NVDA)
- Cross-chain deployment
- Security audit completion

### Phase 2: Advanced Features (Q2 2025)

- American-style options
- Volatility smile modeling
- Automated market making
- Institutional integration

### Phase 3: Institutional (Q3 2025)

- Institutional-grade risk models
- Compliance and reporting
- TradFi integration
- Large-scale deployment

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 **License**

This project is licensed under the UNLICENSED License.

## 🆘 **Support**

For questions and support:

- Create an issue in this repository
- Review the documentation in `/docs`
- Check the test files for usage examples

---

<p align="center">
  <strong>StockLend Protocol V3 - Revolutionary DeFi Lending with Mathematical Precision</strong>
</p>
