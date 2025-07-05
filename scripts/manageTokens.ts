import { ethers } from 'hardhat'
import { getNetworkConfig } from '../deploy/config/testnet-addresses'

async function main() {
    const [deployer] = await ethers.getSigners()
    const networkName = ethers.provider.network.name

    console.log('🔧 Token Management Utility')
    console.log(`Network: ${networkName}`)
    console.log(`Deployer: ${deployer.address}`)

    const networkConfig = getNetworkConfig(networkName)
    if (!networkConfig) {
        console.log('❌ No network configuration found for', networkName)
        return
    }

    console.log(`USDC: ${networkConfig.usdc.name} (${networkConfig.usdc.address})`)
    console.log(`Available tokens: ${Object.keys(networkConfig.tokens).length}`)

    // Try to get deployed StockLendProtocolV2
    try {
        const deployments = await ethers.getContractFactory('StockLendProtocolV2')
        const StockLendProtocolV2 = await deployments.attach(
            process.env.STOCK_LEND_PROTOCOL_V2_ADDRESS || '0x5a7D00BB2822A93227c56B8802FdA551c0598fd5' // Latest deployed address
        )
        console.log(`📍 StockLendProtocolV2 found at: ${StockLendProtocolV2.address}`)

        // List current stock assets
        console.log('\n📋 Current stock assets:')
        for (const [symbol, token] of Object.entries(networkConfig.tokens)) {
            try {
                const asset = await StockLendProtocolV2.stockAssets(token.address)
                if (asset.isActive) {
                    console.log(`✅ ${symbol}: ${token.address} (LTV: ${asset.ltv / 100}%)`)
                } else {
                    console.log(`⚪ ${symbol}: ${token.address} (Not configured)`)
                }
            } catch (error) {
                console.log(`❌ ${symbol}: ${token.address} (Error checking)`)
            }
        }

        // Check protocol status
        const activeLoansCount = await StockLendProtocolV2.getActiveLoansCount()
        const protectionFund = await StockLendProtocolV2.protectionFund()
        const treasury = await StockLendProtocolV2.treasury()

        console.log('\n📊 Protocol Status:')
        console.log(`Active loans: ${activeLoansCount}`)
        console.log(`Protection fund: ${ethers.utils.formatEther(protectionFund)} USDC`)
        console.log(`Treasury: ${treasury}`)
    } catch (error) {
        console.log('❌ StockLendProtocolV2 not found or not deployed')
        console.log('Available tokens for configuration:')
        for (const [symbol, token] of Object.entries(networkConfig.tokens)) {
            console.log(`- ${symbol}: ${token.address} (LTV: ${token.ltv ? token.ltv / 100 + '%' : 'N/A'})`)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
