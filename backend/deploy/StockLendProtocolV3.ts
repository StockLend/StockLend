import { type DeployFunction } from 'hardhat-deploy/types'
import { getNetworkConfig, getUSDCAddress } from '../config/testnet-addresses'
import { ethers } from 'hardhat'

const deployStockLendProtocol: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log('🚀 Deploying StockLend Protocol with Black-Scholes Optimization...')
    console.log('Network:', network.name)
    console.log('Deployer:', deployer)

    // Get USDC address from network configuration
    const USDC_ADDRESS = getUSDCAddress(network.name)
    const networkConfig = getNetworkConfig(network.name)

    if (!USDC_ADDRESS) {
        console.log('⚠️  No USDC found, using mock USDC for testing...')
        // Deploy mock USDC if not exists
        const mockUSDC = await deploy('MyERC20Mock', {
            from: deployer,
            args: ['USD Coin', 'USDC'],
            log: true,
            skipIfAlreadyDeployed: true,
        })
        console.log('📄 Mock USDC deployed at:', mockUSDC.address)
    }

    const usdcAddress = USDC_ADDRESS || (await deployments.get('MyERC20Mock')).address
    console.log('💰 USDC Address:', usdcAddress)

    // Deploy Main Protocol
    const deployment = await deploy('StockLendProtocolV3', {
        from: deployer,
        args: [
            usdcAddress, // USDC token address
            deployer, // Treasury address (deployer for demo)
            deployer, // Owner address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    if (deployment.newlyDeployed) {
        console.log('✅ StockLend Protocol deployed at:', deployment.address)
        console.log('📊 Features enabled:')
        console.log('  - Black-Scholes Put Pricing')
        console.log('  - Dynamic Strike Calculation')
        console.log('  - USDC Yield Optimization (3.75% base)')
        console.log('  - Chainlink Volatility Feeds')
        console.log('  - Gas-Optimized Math Functions')

        // Setup initial configuration
        const contract = await ethers.getContractAt('StockLendProtocolV3', deployment.address)

        // Create demo stock tokens for testing
        console.log('\n🏭 Setting up demo assets...')

        // Deploy Apple Stock Token
        const appleToken = await deploy('MyERC20Mock', {
            from: deployer,
            args: ['Apple Inc Stock', 'AAPL'],
            log: true,
            skipIfAlreadyDeployed: true,
        })

        // Deploy Tesla Stock Token
        const teslaToken = await deploy('MyERC20Mock', {
            from: deployer,
            args: ['Tesla Inc Stock', 'TSLA'],
            log: true,
            skipIfAlreadyDeployed: true,
        })

        // Deploy Mock Price Feeds
        const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed')
        const applePriceFeed = await MockPriceFeed.deploy(200 * 10 ** 8) // $200 AAPL
        await applePriceFeed.deployed()

        const teslaPriceFeed = await MockPriceFeed.deploy(250 * 10 ** 8) // $250 TSLA
        await teslaPriceFeed.deployed()

        console.log('📊 Demo Price Feeds:')
        console.log('  - AAPL Price Feed:', applePriceFeed.address, '($200)')
        console.log('  - TSLA Price Feed:', teslaPriceFeed.address, '($250)')

        // Add stock assets to protocol
        try {
            console.log('\n⚙️  Configuring stock assets...')

            await contract.addStockAssetV3(
                appleToken.address,
                applePriceFeed.address,
                ethers.constants.AddressZero, // No volatility feed for demo
                7500, // 75% LTV
                false // Use default volatility (30%)
            )
            console.log('✅ Added AAPL with 75% LTV')

            await contract.addStockAssetV3(
                teslaToken.address,
                teslaPriceFeed.address,
                ethers.constants.AddressZero, // No volatility feed for demo
                7000, // 70% LTV
                false // Use default volatility (30%)
            )
            console.log('✅ Added TSLA with 70% LTV')

            // Setup initial protection fund
            console.log('\n💰 Setting up protection fund...')
            const mockUSDC = await ethers.getContractAt('MyERC20Mock', usdcAddress)

            // Mint USDC for protection fund
            const protectionAmount = ethers.utils.parseEther('10000') // 10k USDC
            await mockUSDC.mint(deployer, protectionAmount)
            await mockUSDC.approve(contract.address, protectionAmount)
            await contract.depositProtectionFund(protectionAmount)

            console.log('✅ Protection fund initialized with 10,000 USDC')

            // Mint demo tokens for testing
            console.log('\n🎁 Minting demo tokens...')
            const appleTokenContract = await ethers.getContractAt('MyERC20Mock', appleToken.address)
            const teslaTokenContract = await ethers.getContractAt('MyERC20Mock', teslaToken.address)

            await appleTokenContract.mint(deployer, ethers.utils.parseEther('1000'))
            await teslaTokenContract.mint(deployer, ethers.utils.parseEther('500'))
            await mockUSDC.mint(deployer, ethers.utils.parseEther('100000'))

            console.log('✅ Demo tokens minted:')
            console.log('  - 1,000 AAPL tokens')
            console.log('  - 500 TSLA tokens')
            console.log('  - 100,000 USDC tokens')
        } catch (error: any) {
            console.log('⚠️  Setup failed:', error.message)
            console.log('Manual setup required after deployment')
        }

        console.log('\n📋 Protocol Configuration:')
        console.log('━'.repeat(50))
        console.log('🎯 Base USDC Yield: 3.75% APR')
        console.log('💎 Premium Enhancement: +67.7% of base yield')
        console.log('🔒 Protocol Fee: 0.25%')
        console.log('🛡️  Reserve Buffer: 0.5%')
        console.log('📊 Default Volatility: 30% (tech stocks)')
        console.log('⚡ Gas Optimized: <150k gas per loan')
        console.log('🔄 Auto Strike Calculation: Binary search')
        console.log('📈 Black-Scholes Accuracy: ~1% margin')

        console.log('\n🔧 Next Steps:')
        console.log('1. Set Chainlink Automation forwarder')
        console.log('2. Add real volatility feeds for production')
        console.log('3. Configure cross-chain assets (LayerZero)')
        console.log('4. Test with real market data')

        console.log('\n🚀 Ready for demo!')
        console.log('Example loan calculation:')
        console.log('  - Collateral: 100 AAPL @ $200 = $20,000')
        console.log('  - Loan: $15,000 (75% LTV)')
        console.log('  - Duration: 90 days')
        console.log('  - Base yield: $140 (3.75% * 0.25 years)')
        console.log('  - Premium yield: $98 (70% enhancement)')
        console.log('  - Total lender APY: ~6.4% (vs 3.75% base)')
        console.log('  - Put strike: ~$185 (dynamic calculation)')
        console.log('  - Put premium: ~$98 (covers premium yield)')

        console.log('\n🎯 Run Demo:')
        console.log('npx hardhat run scripts/alicePutOptionDemo.ts')
    }
}

deployStockLendProtocol.tags = ['StockLendProtocol', 'main']
export default deployStockLendProtocol
