import { type DeployFunction } from 'hardhat-deploy/types'
import { getNetworkConfig, getUSDCAddress } from './config/testnet-addresses'
import { ethers } from 'hardhat'

const deployStockLendProtocolV2: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log('🚀 Deploying StockLendProtocolV2 with Chainlink Automation...')
    console.log('Network:', network.name)
    console.log('Deployer:', deployer)

    // Get USDC address from network configuration
    const USDC_ADDRESS = getUSDCAddress(network.name)
    const networkConfig = getNetworkConfig(network.name)

    if (!USDC_ADDRESS || !networkConfig) {
        throw new Error(
            `No USDC configuration found for network: ${network.name}. Supported networks: sepolia, base-sepolia, tatara`
        )
    }

    console.log('USDC Address:', USDC_ADDRESS)
    console.log('Network config found:', networkConfig.usdc.name)

    const deployment = await deploy('StockLendProtocolV2', {
        from: deployer,
        args: [
            USDC_ADDRESS, // USDC token address
            deployer, // Treasury address (deployer for now)
            deployer, // Owner address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    if (deployment.newlyDeployed) {
        console.log('✅ StockLendProtocolV2 deployed at:', deployment.address)

        // Auto-configure stock assets if network config exists
        if (networkConfig && Object.keys(networkConfig.tokens).length > 0) {
            console.log('🔧 Auto-configuring stock assets...')

            const contract = await ethers.getContractAt('StockLendProtocolV2', deployment.address)

            for (const [symbol, token] of Object.entries(networkConfig.tokens)) {
                if (token.isActive && token.ltv) {
                    try {
                        console.log(`Adding ${symbol} (${token.address}) with ${token.ltv / 100}% LTV...`)
                        const tx = await contract.addStockAsset(
                            token.address,
                            token.priceFeed || '0x0000000000000000000000000000000000000000', // Zero address for mock feeds
                            token.ltv
                        )
                        await tx.wait()
                        console.log(`✅ Added ${symbol}`)
                    } catch (error) {
                        console.log(`⚠️  Failed to add ${symbol}: ${error}`)
                    }
                }
            }
        }

        console.log('📋 Post-deployment setup required:')
        console.log('1. Fund protection fund with USDC')
        console.log('2. Set Chainlink Automation forwarder address')
        console.log('3. Register upkeep on Chainlink Automation')
        console.log('4. Add real Chainlink price feeds for production')
    }
}

deployStockLendProtocolV2.tags = ['StockLendProtocolV2', 'v2']

export default deployStockLendProtocolV2
