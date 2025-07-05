import { ethers } from 'hardhat'
import { deployments } from 'hardhat'

async function main() {
    console.log('🗾 Deploying StockLend Protocol to Katana Network')
    console.log('='.repeat(60))

    const [deployer] = await ethers.getSigners()
    console.log('👤 Deployer Account:', deployer.address)

    // Check network
    const network = await ethers.provider.getNetwork()
    console.log('🌐 Network:', network.name)
    console.log('🔗 Chain ID:', network.chainId)

    // Check balance
    const balance = await deployer.getBalance()
    console.log('💰 Deployer Balance:', ethers.utils.formatEther(balance), 'ETH')

    if (balance.lt(ethers.utils.parseEther('0.1'))) {
        console.warn('⚠️  Low balance! You may need more ETH for deployment.')
    }

    try {
        console.log('\n📋 Deployment Plan for Katana:')
        console.log('1. Deploy MyERC20Mock (USDC)')
        console.log('2. Deploy StockToken contracts (AAPL, TSLA)')
        console.log('3. Deploy StockLendProtocolV2 with Chainlink Automation')
        console.log('4. Deploy StockLendOFTAdapter for cross-chain')
        console.log('5. Setup and configure all contracts')

        // Step 1: Deploy USDC Mock
        console.log('\n🪙 Step 1: Deploying USDC Mock...')

        const MyERC20Mock = await ethers.getContractFactory('MyERC20Mock')
        const usdc = await MyERC20Mock.deploy('USD Coin', 'USDC')
        await usdc.deployed()

        console.log('✅ USDC Mock deployed at:', usdc.address)

        // Step 2: Deploy Stock Tokens
        console.log('\n📈 Step 2: Deploying Stock Tokens...')

        const StockToken = await ethers.getContractFactory('StockToken')

        const aaplToken = await StockToken.deploy('Apple Stock Token', 'sAAPL', 'AAPL', 'Apple Inc.', deployer.address)
        await aaplToken.deployed()

        const tslaToken = await StockToken.deploy('Tesla Stock Token', 'sTSLA', 'TSLA', 'Tesla Inc.', deployer.address)
        await tslaToken.deployed()

        console.log('✅ AAPL Token deployed at:', aaplToken.address)
        console.log('✅ TSLA Token deployed at:', tslaToken.address)

        // Step 3: Deploy StockLendProtocolV2
        console.log('\n🏦 Step 3: Deploying StockLendProtocolV2...')

        const StockLendProtocolV2 = await ethers.getContractFactory('StockLendProtocolV2')
        const stockLendProtocol = await StockLendProtocolV2.deploy(
            usdc.address, // USDC
            deployer.address, // Treasury
            deployer.address // Owner
        )
        await stockLendProtocol.deployed()

        console.log('✅ StockLendProtocolV2 deployed at:', stockLendProtocol.address)

        // Step 4: Deploy OFT Adapter for cross-chain
        console.log('\n🌉 Step 4: Deploying StockLendOFTAdapter...')

        // LayerZero V2 endpoint for Katana mainnet
        const lzEndpoint = '0x1a44076050125825900e736c501f859c50fE728c' // LayerZero V2 Endpoint

        const StockLendOFTAdapter = await ethers.getContractFactory('StockLendOFTAdapter')
        const oftAdapter = await StockLendOFTAdapter.deploy(
            aaplToken.address,
            lzEndpoint,
            deployer.address,
            'AAPL',
            'Apple Inc.'
        )
        await oftAdapter.deployed()

        console.log('✅ StockLendOFTAdapter deployed at:', oftAdapter.address)

        // Step 5: Setup and Configuration
        console.log('\n⚙️  Step 5: Setting up contracts...')

        // Authorize minting
        console.log('Authorizing token minting...')
        await aaplToken.authorizeMinter(deployer.address)
        await tslaToken.authorizeMinter(deployer.address)

        // Mint initial tokens
        console.log('Minting initial tokens...')
        await aaplToken.mint(deployer.address, ethers.utils.parseEther('1000'), 'Initial mint')
        await tslaToken.mint(deployer.address, ethers.utils.parseEther('500'), 'Initial mint')
        await usdc.mint(deployer.address, ethers.utils.parseEther('100000')) // 100k USDC

        // Fund protection fund
        console.log('Setting up protection fund...')
        const protectionAmount = ethers.utils.parseEther('10000') // 10k USDC
        await usdc.approve(stockLendProtocol.address, protectionAmount)
        await stockLendProtocol.depositProtectionFund(protectionAmount)

        // Add stock assets (using mock price feeds for now)
        console.log('Adding stock assets...')
        await stockLendProtocol.addStockAsset(
            aaplToken.address,
            '0x0000000000000000000000000000000000000000', // Mock price feed
            7500 // 75% LTV
        )

        await stockLendProtocol.addStockAsset(
            tslaToken.address,
            '0x0000000000000000000000000000000000000000', // Mock price feed
            7000 // 70% LTV
        )

        // Approve protocol for lending
        await usdc.approve(stockLendProtocol.address, ethers.constants.MaxUint256)

        console.log('\n🎉 Deployment Complete!')
        console.log('='.repeat(60))

        // Summary
        console.log('\n📊 Deployment Summary:')
        console.log('Network:', network.name, `(Chain ID: ${network.chainId})`)
        console.log('\n📍 Contract Addresses:')
        console.log('├── USDC Mock:', usdc.address)
        console.log('├── AAPL Token:', aaplToken.address)
        console.log('├── TSLA Token:', tslaToken.address)
        console.log('├── StockLendProtocolV2:', stockLendProtocol.address)
        console.log('└── StockLendOFTAdapter:', oftAdapter.address)

        console.log('\n💰 Initial Balances:')
        console.log('├── Your AAPL:', ethers.utils.formatEther(await aaplToken.balanceOf(deployer.address)))
        console.log('├── Your TSLA:', ethers.utils.formatEther(await tslaToken.balanceOf(deployer.address)))
        console.log('├── Your USDC:', ethers.utils.formatEther(await usdc.balanceOf(deployer.address)))
        console.log('└── Protection Fund:', ethers.utils.formatEther(await stockLendProtocol.protectionFund()), 'USDC')

        console.log('\n🔧 Next Steps for Katana:')
        console.log('1. 🤖 Set up Chainlink Automation (if available on Katana)')
        console.log('2. 🔗 Configure real price feeds for production')
        console.log('3. 🌉 Set up LayerZero endpoints for cross-chain')
        console.log('4. 🏦 Integrate with Katana DeFi ecosystem:')
        console.log('   ├── Morpho (lending protocol)')
        console.log('   ├── Sushi (spot DEX)')
        console.log('   └── Vertex (perp DEX)')
        console.log('5. 🎯 Create loans and test put option protection')

        console.log('\n🚀 StockLend Protocol is now live on Katana!')

        // Create a test loan to demonstrate functionality
        console.log('\n🧪 Creating test loan...')

        await aaplToken.approve(stockLendProtocol.address, ethers.utils.parseEther('5'))

        const createTx = await stockLendProtocol.createLoan(
            aaplToken.address,
            ethers.utils.parseEther('2'), // 2 AAPL tokens
            ethers.utils.parseEther('120'), // $120 USDC
            30 * 24 * 60 * 60 // 30 days
        )
        const receipt = await createTx.wait()

        console.log('✅ Test loan created! Transaction:', receipt.transactionHash)

        const loanEvent = receipt.events?.find((e) => e.event === 'LoanCreated')
        if (loanEvent) {
            const loanId = loanEvent.args?.loanId
            console.log('📝 Loan ID:', loanId.toString())

            const loan = await stockLendProtocol.getLoan(loanId)
            console.log('💎 Put Strike Price: $' + ethers.utils.formatUnits(loan.putStrike, 8))
            console.log('📈 Creation Price: $' + ethers.utils.formatUnits(loan.creationPrice, 8))
            console.log('⏰ Expiration:', new Date(loan.expiration.toNumber() * 1000).toLocaleString())
        }

        console.log("\n🌟 Ready to leverage Katana's DeFi ecosystem!")
    } catch (error) {
        console.error('❌ Deployment Error:', error)
        process.exit(1)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
