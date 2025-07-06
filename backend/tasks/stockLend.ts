import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

// Create a loan task
task('stock-lend:create-loan', 'Create a new loan with stock collateral')
    .addParam('stock', 'Stock token address')
    .addParam('collateral', 'Collateral amount in tokens')
    .addParam('loan', 'Loan amount in USDC')
    .addParam('duration', 'Loan duration in seconds')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { ethers, deployments } = hre
        const [signer] = await ethers.getSigners()

        const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
        const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)
        const stockToken = await ethers.getContractAt('StockToken', taskArgs.stock)

        console.log('📋 Creating loan...')
        console.log('- Stock Token:', taskArgs.stock)
        console.log('- Collateral Amount:', taskArgs.collateral)
        console.log('- Loan Amount:', taskArgs.loan)
        console.log('- Duration:', taskArgs.duration)

        // Approve stock token transfer
        console.log('🔐 Approving stock token transfer...')
        await stockToken.approve(stockLendProtocol.address, taskArgs.collateral)

        // Create loan
        console.log('💰 Creating loan...')
        const tx = await stockLendProtocol.createLoan(
            taskArgs.stock,
            taskArgs.collateral,
            taskArgs.loan,
            taskArgs.duration
        )

        const receipt = await tx.wait()
        console.log('✅ Loan created! Transaction hash:', receipt.transactionHash)

        // Get loan details
        const loanId = receipt.events?.find((e) => e.event === 'LoanCreated')?.args?.loanId
        if (loanId) {
            const loan = await stockLendProtocol.getLoan(loanId)
            console.log('📊 Loan Details:')
            console.log('- Loan ID:', loanId.toString())
            console.log('- Borrower:', loan.borrower)
            console.log('- Put Strike:', ethers.utils.formatEther(loan.putStrike))
            console.log('- Expiration:', new Date(loan.expiration.toNumber() * 1000).toLocaleString())
        }
    })

// Repay loan task
task('stock-lend:repay-loan', 'Repay a loan')
    .addParam('loanid', 'Loan ID to repay')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { ethers, deployments } = hre
        const [signer] = await ethers.getSigners()

        const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
        const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)
        const usdc = await ethers.getContractAt('IERC20', await stockLendProtocol.USDC())

        console.log('💳 Repaying loan...')
        console.log('- Loan ID:', taskArgs.loanid)

        // Get loan details
        const loan = await stockLendProtocol.getLoan(taskArgs.loanid)
        const repayAmount = loan.loanAmount.add(loan.interestRate)

        console.log('- Repay Amount:', ethers.utils.formatEther(repayAmount))

        // Approve USDC transfer
        console.log('🔐 Approving USDC transfer...')
        await usdc.approve(stockLendProtocol.address, repayAmount)

        // Repay loan
        console.log('✅ Repaying loan...')
        const tx = await stockLendProtocol.repayLoan(taskArgs.loanid)

        const receipt = await tx.wait()
        console.log('✅ Loan repaid! Transaction hash:', receipt.transactionHash)
    })

// Add stock asset task
task('stock-lend:add-stock', 'Add a supported stock asset')
    .addParam('token', 'Stock token address')
    .addParam('pricefeed', 'Chainlink price feed address')
    .addParam('ltv', 'Maximum LTV in basis points')
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const { ethers, deployments } = hre

        const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
        const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)

        console.log('🏭 Adding stock asset...')
        console.log('- Token:', taskArgs.token)
        console.log('- Price Feed:', taskArgs.pricefeed)
        console.log('- LTV:', taskArgs.ltv)

        const tx = await stockLendProtocol.addStockAsset(taskArgs.token, taskArgs.pricefeed, taskArgs.ltv)

        const receipt = await tx.wait()
        console.log('✅ Stock asset added! Transaction hash:', receipt.transactionHash)
    })

// Setup demo task
task('stock-lend:demo-setup', 'Setup demo environment').setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers, deployments } = hre
    const [signer] = await ethers.getSigners()

    console.log('🚀 Setting up StockLend Demo...')

    // Get contracts
    const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
    const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)

    const stockTokenAAPLDeployment = await deployments.get('StockToken_AAPL')
    const stockTokenAAPL = await ethers.getContractAt('StockToken', stockTokenAAPLDeployment.address)

    const stockTokenTSLADeployment = await deployments.get('StockToken_TSLA')
    const stockTokenTSLA = await ethers.getContractAt('StockToken', stockTokenTSLADeployment.address)

    // Authorize protocol to mint tokens for demo
    console.log('🔐 Authorizing minters...')
    await stockTokenAAPL.authorizeMinter(signer.address)
    await stockTokenTSLA.authorizeMinter(signer.address)

    // Mint demo tokens
    console.log('💎 Minting demo tokens...')
    await stockTokenAAPL.mint(signer.address, ethers.utils.parseEther('100'), 'Demo setup')
    await stockTokenTSLA.mint(signer.address, ethers.utils.parseEther('50'), 'Demo setup')

    // Add stock assets to protocol
    console.log('🏭 Adding stock assets...')
    await stockLendProtocol.addStockAsset(
        stockTokenAAPL.address,
        '0x0000000000000000000000000000000000000000', // Mock price feed
        7500 // 75% LTV
    )

    await stockLendProtocol.addStockAsset(
        stockTokenTSLA.address,
        '0x0000000000000000000000000000000000000000', // Mock price feed
        7000 // 70% LTV
    )

    console.log('✅ Demo setup complete!')
    console.log('📊 Summary:')
    console.log('- StockLend Protocol:', stockLendProtocol.address)
    console.log('- AAPL Token:', stockTokenAAPL.address)
    console.log('- TSLA Token:', stockTokenTSLA.address)
    console.log('- Your AAPL Balance:', ethers.utils.formatEther(await stockTokenAAPL.balanceOf(signer.address)))
    console.log('- Your TSLA Balance:', ethers.utils.formatEther(await stockTokenTSLA.balanceOf(signer.address)))
})
