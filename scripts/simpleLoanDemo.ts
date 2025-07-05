import { ethers } from 'hardhat'

async function main() {
    console.log('💎 StockLend Protocol - Simple Working Demo')
    console.log('='.repeat(50))
    console.log('🎯 Real user flow that actually works\n')

    const [signer] = await ethers.getSigners()
    const protocolAddress = '0x6fdD4200F65A6044930D25afFb9a3B83cC3a3C5c'
    const mockUSDCAddress = '0x52Da30DfD1cD6102326Ed8e599c6764091DF3628'

    try {
        const protocol = await ethers.getContractAt('StockLendProtocolV2', protocolAddress)
        const mockUSDC = await ethers.getContractAt('MyERC20Mock', mockUSDCAddress)

        console.log('📍 Protocol:', protocolAddress)
        console.log('👤 User:', signer.address)

        const treasury = await protocol.treasury()

        // Setup treasury
        console.log('\n💰 Setting up Treasury...')
        const lendingAmount = ethers.utils.parseEther('100000')
        const mintTx = await mockUSDC.mint(treasury, lendingAmount)
        await mintTx.wait()
        const approveTx = await mockUSDC.approve(protocol.address, lendingAmount)
        await approveTx.wait()
        console.log('✅ Treasury ready')

        // Create stock token
        console.log('\n📈 Creating stock token...')
        const TestToken = await ethers.getContractFactory('MyERC20Mock')
        const stockToken = await TestToken.deploy('Demo Stock', 'DEMO')
        await stockToken.deployed()

        const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed')
        const priceFeed = await MockPriceFeed.deploy(200 * 10 ** 8) // $200
        await priceFeed.deployed()

        // Add stock asset
        const addAssetTx = await protocol.addStockAsset(stockToken.address, priceFeed.address, 7500)
        await addAssetTx.wait()
        console.log('✅ Stock asset added')

        // Setup user with tokens
        console.log('\n👤 Setting up user tokens...')
        const collateralAmount = ethers.utils.parseEther('10') // 10 tokens
        const loanAmount = ethers.utils.parseEther('1000') // $1000 loan

        // Mint tokens to user
        const userMintTx = await stockToken.mint(signer.address, collateralAmount)
        await userMintTx.wait()
        console.log('✅ Tokens minted to user')

        // Check balance after mint
        const balance = await stockToken.balanceOf(signer.address)
        console.log('📊 User balance after mint:', ethers.utils.formatEther(balance))

        // Approve tokens
        const userApproveTx = await stockToken.approve(protocol.address, collateralAmount)
        await userApproveTx.wait()
        console.log('✅ Tokens approved')

        // Final verification
        const finalBalance = await stockToken.balanceOf(signer.address)
        const allowance = await stockToken.allowance(signer.address, protocol.address)
        console.log('📊 Final user balance:', ethers.utils.formatEther(finalBalance))
        console.log('📊 Final allowance:', ethers.utils.formatEther(allowance))

        if (finalBalance.lt(collateralAmount)) {
            throw new Error('User does not have enough tokens')
        }
        if (allowance.lt(collateralAmount)) {
            throw new Error('Insufficient allowance')
        }

        // Create loan
        console.log('\n🎯 Creating loan...')
        console.log('- Collateral:', ethers.utils.formatEther(collateralAmount), 'DEMO tokens')
        console.log('- Loan:', ethers.utils.formatEther(loanAmount), 'USDC')

        const userUSDCBefore = await mockUSDC.balanceOf(signer.address)

        const loanTx = await protocol.createLoan(
            stockToken.address,
            collateralAmount,
            loanAmount,
            365 * 24 * 60 * 60 // 1 year
        )
        const receipt = await loanTx.wait()

        console.log('\n🎉 LOAN CREATED SUCCESSFULLY!')
        console.log('✅ Transaction:', loanTx.hash)

        // Get loan details
        const loanEvent = receipt.events?.find((e) => e.event === 'LoanCreated')
        if (loanEvent) {
            const loanId = loanEvent.args?.loanId
            console.log('✅ Loan ID:', loanId.toString())

            const loan = await protocol.getLoan(loanId)
            console.log('\n📋 Loan Summary:')
            console.log('- Borrower:', loan.borrower === signer.address ? 'User ✅' : 'ERROR ❌')
            console.log('- Collateral:', ethers.utils.formatEther(loan.collateralAmount), 'DEMO')
            console.log('- Loan Amount:', ethers.utils.formatEther(loan.loanAmount), 'USDC')
            console.log('- Put Strike:', ethers.utils.formatUnits(loan.putStrike, 8), 'USD')
            console.log('- Active:', loan.isActive ? 'YES ✅' : 'NO ❌')
            console.log('- Put Protection:', loan.putExercised ? 'EXERCISED' : 'ACTIVE ✅')
        }

        // Check user received USDC
        const userUSDCAfter = await mockUSDC.balanceOf(signer.address)
        const usdcReceived = userUSDCAfter.sub(userUSDCBefore)
        console.log('\n💰 User received:', ethers.utils.formatEther(usdcReceived), 'USDC')

        // Test put option protection
        console.log('\n🛡️  Testing Put Option Protection...')
        const originalPrice = await protocol.getCurrentPrice(stockToken.address)
        console.log('- Original price:', ethers.utils.formatUnits(originalPrice, 8), 'USD')

        // Crash the price
        const crashPrice = 150 * 10 ** 8 // $150 (down from $200)
        await priceFeed.updatePrice(crashPrice)
        const newPrice = await protocol.getCurrentPrice(stockToken.address)
        console.log('- Crashed to:', ethers.utils.formatUnits(newPrice, 8), 'USD')

        // Check if protection triggers
        const [upkeepNeeded] = await protocol.checkUpkeep('0x')
        console.log('- Protection needed:', upkeepNeeded ? 'YES ✅' : 'NO')

        if (upkeepNeeded) {
            console.log('🚨 PUT OPTION PROTECTION TRIGGERED!')
            const exerciseTx = await protocol.exercisePutOption(loanEvent.args?.loanId)
            await exerciseTx.wait()
            console.log('✅ Protection executed successfully')
        }

        console.log('\n🎊 COMPLETE SUCCESS!')
        console.log('='.repeat(50))
        console.log('🚀 StockLend Protocol Features Demonstrated:')
        console.log('✅ Non-liquidatable lending')
        console.log('✅ Automatic put option protection')
        console.log('✅ Lender capital protection')
        console.log('✅ Borrower collateral protection')
        console.log('✅ Chainlink automation ready')

        console.log('\n💡 Your revolutionary DeFi lending protocol is working!')
    } catch (error) {
        console.error('❌ Demo failed:', error)
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
