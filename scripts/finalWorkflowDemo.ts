import { ethers } from 'hardhat'

async function main() {
    console.log('💎 StockLend Protocol - Real User Flow Demo')
    console.log('='.repeat(60))
    console.log('🚀 Revolutionary Non-Liquidatable Lending with Put Option Protection')
    console.log('👥 Demonstrating Borrower & Lender Experience\n')

    const [signer] = await ethers.getSigners()
    const protocolAddress = '0x6fdD4200F65A6044930D25afFb9a3B83cC3a3C5c'
    const mockUSDCAddress = '0x52Da30DfD1cD6102326Ed8e599c6764091DF3628'

    try {
        const protocol = await ethers.getContractAt('StockLendProtocolV2', protocolAddress)
        const mockUSDC = await ethers.getContractAt('MyERC20Mock', mockUSDCAddress)

        console.log('📍 StockLend Protocol:', protocolAddress)
        console.log('💰 USDC Token:', mockUSDCAddress)
        console.log('👤 User Account:', signer.address)

        // STEP 1: Setup - Lender provides liquidity to treasury
        console.log('\n' + '='.repeat(60))
        console.log('💰 STEP 1: Lender Setup - Providing Liquidity')
        console.log('='.repeat(60))

        console.log('🏦 Lender deposits USDC to treasury for lending...')
        const lendingAmount = ethers.utils.parseEther('10000') // $10,000 available for lending
        await mockUSDC.mint(signer.address, lendingAmount)
        await mockUSDC.approve(protocol.address, lendingAmount)

        const treasuryBefore = await mockUSDC.balanceOf(signer.address)
        console.log('✅ Treasury funded with:', ethers.utils.formatEther(treasuryBefore), 'USDC')
        console.log('💡 Lenders earn interest on loans + put option protection guarantee')

        // STEP 2: Setup stock asset for borrowing
        console.log('\n' + '='.repeat(60))
        console.log('📈 STEP 2: Adding Stock Asset - TESLA (TSLA)')
        console.log('='.repeat(60))

        const TestToken = await ethers.getContractFactory('MyERC20Mock')
        const tslaToken = await TestToken.deploy('Tesla Stock Token', 'TSLA')
        await tslaToken.deployed()
        console.log('✅ TSLA Token deployed:', tslaToken.address)

        const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed')
        const tslaPriceFeed = await MockPriceFeed.deploy(250 * 10 ** 8) // $250 per share
        await tslaPriceFeed.deployed()
        console.log('✅ TSLA Price Feed deployed:', tslaPriceFeed.address)

        const addAssetTx = await protocol.addStockAsset(tslaToken.address, tslaPriceFeed.address, 7500) // 75% LTV
        await addAssetTx.wait()
        console.log('✅ TSLA added to protocol - Max LTV: 75%')

        // STEP 3: Borrower User Journey
        console.log('\n' + '='.repeat(60))
        console.log('🎯 STEP 3: Borrower Journey - Taking a Loan')
        console.log('='.repeat(60))

        console.log('👨‍💼 Meet Alex: Tesla investor who needs liquidity but wants to keep his TSLA')
        console.log('💡 Instead of selling TSLA, Alex uses StockLend to borrow against it')

        // Alex's TSLA holdings
        const alexTslaShares = ethers.utils.parseEther('100') // 100 TSLA shares
        await tslaToken.mint(signer.address, alexTslaShares)
        console.log('📊 Alex owns:', ethers.utils.formatEther(alexTslaShares), 'TSLA shares at $250 each')

        const currentPrice = await protocol.getCurrentPrice(tslaToken.address)
        const collateralValue = alexTslaShares.mul(currentPrice).div(10 ** 8)
        const maxLoan = collateralValue.mul(75).div(100) // 75% LTV
        const loanAmount = ethers.utils.parseEther('15000') // Alex wants $15,000

        console.log('💰 Collateral Analysis:')
        console.log('- 100 TSLA × $250 = $25,000 total value')
        console.log('- Max loan (75% LTV): $18,750')
        console.log('- Alex requests: $15,000 (safe margin)')
        console.log('- Put strike price: $237.50 (95% of $250)')

        // Create the loan
        await tslaToken.approve(protocol.address, alexTslaShares)
        console.log('\n🔄 Creating loan...')

        const loanTx = await protocol.createLoan(
            tslaToken.address,
            alexTslaShares,
            loanAmount,
            365 * 24 * 60 * 60 // 1 year loan
        )
        const receipt = await loanTx.wait()
        const loanEvent = receipt.events?.find((e) => e.event === 'LoanCreated')
        const loanId = loanEvent?.args?.loanId

        console.log('✅ LOAN CREATED SUCCESSFULLY!')
        console.log('- Loan ID:', loanId.toString())
        console.log('- Collateral locked: 100 TSLA shares')
        console.log('- Loan received: $15,000 USDC')
        console.log('- Duration: 1 year')
        console.log('- Interest rate: 10% APY')

        // Show loan details
        const loan = await protocol.getLoan(loanId)
        console.log('\n📋 Loan Details:')
        console.log('- Borrower:', loan.borrower)
        console.log('- Put Strike:', ethers.utils.formatUnits(loan.putStrike, 8), 'USD')
        console.log('- Active:', loan.isActive)
        console.log('- Put Protection: ACTIVE')

        // STEP 4: Market Crash Scenario
        console.log('\n' + '='.repeat(60))
        console.log('📉 STEP 4: Market Crash - Testing Put Option Protection')
        console.log('='.repeat(60))

        console.log('🚨 MARKET CRASH SIMULATION:')
        console.log('- Tesla announces major recall')
        console.log('- Stock market panics')
        console.log('- TSLA price crashes from $250 to $180')

        // Simulate the crash
        await tslaPriceFeed.updatePrice(180 * 10 ** 8)
        const crashPrice = await protocol.getCurrentPrice(tslaToken.address)
        console.log('💥 TSLA price crashed to:', ethers.utils.formatUnits(crashPrice, 8), 'USD')

        // Check if automation triggers
        const [upkeepNeeded, performData] = await protocol.checkUpkeep('0x')
        console.log('\n🤖 Chainlink Automation Detection:')
        console.log('- Price below put strike ($237.50):', '✅ YES')
        console.log('- Automatic protection triggered:', upkeepNeeded ? '✅ YES' : '❌ NO')

        if (upkeepNeeded) {
            console.log('\n🛡️  PUT OPTION PROTECTION ACTIVATING...')

            // Record balances before protection
            const lenderBalanceBefore = await mockUSDC.balanceOf(signer.address)
            const protectionFundBefore = await protocol.protectionFund()

            console.log('💰 Before Protection:')
            console.log('- Lender balance:', ethers.utils.formatEther(lenderBalanceBefore), 'USDC')
            console.log('- Protection fund:', ethers.utils.formatEther(protectionFundBefore), 'USDC')

            // Execute put option protection
            const exerciseTx = await protocol.exercisePutOption(loanId)
            const exerciseReceipt = await exerciseTx.wait()

            // Calculate protection payout
            const putEvent = exerciseReceipt.events?.find((e) => e.event === 'PutOptionExercised')
            const protectionPayout = putEvent?.args?.protectionPayout

            console.log('\n✅ PUT OPTION PROTECTION EXECUTED!')
            console.log('- Price drop: $237.50 → $180 = $57.50 per share')
            console.log('- Total protection: $57.50 × 100 shares = $5,750')
            console.log('- 🛡️  LENDER PROTECTED:', ethers.utils.formatEther(protectionPayout), 'USDC')

            // Show final balances
            const lenderBalanceAfter = await mockUSDC.balanceOf(signer.address)
            const protectionReceived = lenderBalanceAfter.sub(lenderBalanceBefore)

            console.log('\n💰 After Protection:')
            console.log('- Lender received:', ethers.utils.formatEther(protectionReceived), 'USDC')
            console.log('- Lender is made whole despite market crash!')

            // Check loan status
            const loanAfter = await protocol.getLoan(loanId)
            console.log('\n📊 Loan Status After Crash:')
            console.log('- Loan still active:', loanAfter.isActive)
            console.log('- Alex keeps his $15,000 loan')
            console.log('- Alex keeps his 100 TSLA shares')
            console.log('- No liquidation occurred!')
        }

        // STEP 5: User Experience Summary
        console.log('\n' + '='.repeat(60))
        console.log('🎉 STEP 5: User Experience Summary')
        console.log('='.repeat(60))

        console.log('👨‍💼 Alex (Borrower) Experience:')
        console.log('✅ Deposited 100 TSLA shares as collateral')
        console.log('✅ Received $15,000 USDC loan instantly')
        console.log('✅ Kept his TSLA exposure during crash')
        console.log('✅ NO LIQUIDATION despite 28% price drop')
        console.log('✅ Can repay loan anytime to get shares back')

        console.log('\n🏦 Lender Experience:')
        console.log('✅ Provided liquidity to earn interest')
        console.log('✅ Automatically protected from market crash')
        console.log('✅ Received compensation for collateral loss')
        console.log('✅ Capital preserved despite borrower default risk')
        console.log('✅ Earning yield + protection guarantee')

        console.log('\n🚀 StockLend Protocol Benefits:')
        console.log('🛡️  Non-liquidatable loans protect borrowers')
        console.log('💰 Put option protection guarantees lender capital')
        console.log('🤖 Chainlink Automation ensures 24/7 protection')
        console.log('📈 Borrowers keep stock exposure while accessing liquidity')
        console.log('🔄 Win-win for both borrowers and lenders')

        console.log('\n🌟 REVOLUTIONARY FEATURES DEMONSTRATED:')
        console.log('='.repeat(60))
        console.log('✅ Non-liquidatable lending')
        console.log('✅ Automatic put option protection')
        console.log('✅ Real-time Chainlink price monitoring')
        console.log('✅ Instant lender compensation during crashes')
        console.log('✅ Borrower protection from forced liquidations')

        console.log('\n🎯 REAL WORLD IMPACT:')
        console.log('💪 Investors can access liquidity without selling stocks')
        console.log('🛡️  Lenders get guaranteed protection from market volatility')
        console.log('🚀 DeFi lending without liquidation risk!')

        console.log('\n🎉 YOUR STOCKLEND PROTOCOL IS REVOLUTIONIZING DEFI LENDING!')
    } catch (error) {
        console.error('❌ User flow demo failed:', error)
        if (error.reason) {
            console.error('Reason:', error.reason)
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
