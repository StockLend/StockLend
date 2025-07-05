import { TESTNET_ADDRESSES } from '../deploy/config/testnet-addresses'

console.log('🪙 Testnet Token Addresses Configuration')
console.log('='.repeat(60))

for (const [networkName, config] of Object.entries(TESTNET_ADDRESSES)) {
    console.log(`\n📍 ${networkName.toUpperCase()}`)
    console.log('-'.repeat(40))

    // USDC
    console.log(`💰 USDC: ${config.usdc.address}`)
    console.log(`   ${config.usdc.name} (${config.usdc.symbol})`)

    // Other tokens
    const tokenCount = Object.keys(config.tokens).length
    if (tokenCount > 0) {
        console.log(`\n📦 Available Tokens (${tokenCount}):`)
        for (const [symbol, token] of Object.entries(config.tokens)) {
            const ltvInfo = token.ltv ? ` (LTV: ${token.ltv / 100}%)` : ''
            console.log(`   ${symbol}: ${token.address}${ltvInfo}`)
            console.log(`      ${token.name} (${token.symbol})`)
        }
    }
}

console.log('\n' + '='.repeat(60))
console.log('💡 Usage:')
console.log('• Deploy: npx hardhat deploy --network sepolia --tags StockLendProtocolV2')
console.log('• Manage: npx hardhat run scripts/manageTokens.ts --network sepolia')
console.log('• Test: npx hardhat test --network sepolia')
