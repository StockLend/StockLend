import { ethers } from 'hardhat'
import { deployments } from 'hardhat'

async function main() {
    console.log('🎯 Complete StockLend Loan Demo')
    console.log('='.repeat(50))

    const [signer] = await ethers.getSigners()
    console.log('👤 Account:', signer.address)

    try {
        // Get deployed contracts
        const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
        const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)

        const stockTokenAAPLDeployment = await deployments.get('StockToken_AAPL')
        const stockTokenAAPL = await ethers.getContractAt('StockToken', stockTokenAAPLDeployment.address)

        // Get USDC and treasury info
        const usdcAddress = await stockLendProtocol.USDC()
        const usdc = await ethers.getContractAt('MyERC20Mock', usdcAddress)
        const treasury = await stockLendProtocol.treasury()

        console.log('📍 Contract Addresses:')
        console.log('- StockLend Protocol:', stockLendProtocol.address)
        console.log('- AAPL Token:', stockTokenAAPL.address)
        console.log('- USDC Token:', usdcAddress)
        console.log('- Treasury:', treasury)

        // Step 1: Check current balances
        console.log('\n💰 Current Balances:')
        const userUSDC = await usdc.balanceOf(signer.address)
        const treasuryUSDC = await usdc.balanceOf(treasury)
        const userAAPL = await stockTokenAAPL.balanceOf(signer.address)

        console.log('- Your USDC:', ethers.utils.formatEther(userUSDC))
        console.log('- Treasury USDC:', ethers.utils.formatEther(treasuryUSDC))
        console.log('- Your AAPL:', ethers.utils.formatEther(userAAPL))

        // Step 2: Fund the treasury if needed
        if (treasuryUSDC.lt(ethers.utils.parseEther('1000'))) {
            console.log('\n💸 Funding treasury with USDC...')

            // Mint USDC to treasury (since we're using MyERC20Mock)
            const mintAmount = ethers.utils.parseEther('10000') // 10,000 USDC
            console.log('Minting', ethers.utils.formatEther(mintAmount), 'USDC to treasury...')

            const mintTx = await usdc.mint(treasury, mintAmount)
            await mintTx.wait()

            const newTreasuryBalance = await usdc.balanceOf(treasury)
            console.log('✅ Treasury funded! New balance:', ethers.utils.formatEther(newTreasuryBalance), 'USDC')
        }

        // Step 3: Approve treasury to spend USDC for loans
        console.log('\n🔐 Setting up treasury approval...')

        // Since treasury is the deployer address, we need to approve the protocol to spend treasury's USDC
        const treasuryUsdc = await ethers.getContractAt('MyERC20Mock', usdcAddress)
        const maxApproval = ethers.constants.MaxUint256

        const approvalTx = await treasuryUsdc.approve(stockLendProtocol.address, maxApproval)
        await approvalTx.wait()
        console.log('✅ Treasury approval set')

        // Step 4: Create a loan
        console.log('\n💰 Creating loan with AAPL collateral...')

        const collateralAmount = ethers.utils.parseEther('2') // 2 AAPL tokens
        const loanAmount = ethers.utils.parseEther('100') // $100 USDC (safe 50% LTV)
        const duration = 30 * 24 * 60 * 60 // 30 days

        console.log('Loan Parameters:')
        console.log('- Collateral:', ethers.utils.formatEther(collateralAmount), 'AAPL')
        console.log('- Loan Amount:', ethers.utils.formatEther(loanAmount), 'USDC')
        console.log('- Duration:', duration / (24 * 60 * 60), 'days')

        // Approve AAPL transfer
        console.log('Approving AAPL tokens...')
        const approveAAPLTx = await stockTokenAAPL.approve(stockLendProtocol.address, collateralAmount)
        await approveAAPLTx.wait()

        // Create the loan
        console.log('Creating loan...')
        const createLoanTx = await stockLendProtocol.createLoan(
            stockTokenAAPL.address,
            collateralAmount,
            loanAmount,
            duration
        )
        const receipt = await createLoanTx.wait()

        console.log('✅ Loan created successfully!')
        console.log('Transaction hash:', receipt.transactionHash)

        // Get loan details
        const loanCreatedEvent = receipt.events?.find((e) => e.event === 'LoanCreated')
        if (loanCreatedEvent) {
            const loanId = loanCreatedEvent.args?.loanId
            console.log('\n📊 Loan Details:')
            console.log('- Loan ID:', loanId.toString())

            const loan = await stockLendProtocol.getLoan(loanId)
            console.log('- Borrower:', loan.borrower)
            console.log('- Stock Token:', loan.stockToken)
            console.log('- Collateral Amount:', ethers.utils.formatEther(loan.collateralAmount), 'AAPL')
            console.log('- Loan Amount:', ethers.utils.formatEther(loan.loanAmount), 'USDC')
            console.log('- Interest Rate:', ethers.utils.formatEther(loan.interestRate), 'USDC')
            console.log('- Put Strike:', ethers.utils.formatEther(loan.putStrike), 'USDC per AAPL')
            console.log('- Expiration:', new Date(loan.expiration.toNumber() * 1000).toLocaleString())
            console.log('- Is Active:', loan.isActive)
            console.log('- Put Exercised:', loan.putExercised)

            // Check updated balances
            console.log('\n💰 Updated Balances:')
            const newUserUSDC = await usdc.balanceOf(signer.address)
            const newUserAAPL = await stockTokenAAPL.balanceOf(signer.address)
            const protocolAAPL = await stockTokenAAPL.balanceOf(stockLendProtocol.address)

            console.log(
                '- Your USDC:',
                ethers.utils.formatEther(newUserUSDC),
                '(+' + ethers.utils.formatEther(newUserUSDC.sub(userUSDC)) + ')'
            )
            console.log(
                '- Your AAPL:',
                ethers.utils.formatEther(newUserAAPL),
                '(-' + ethers.utils.formatEther(userAAPL.sub(newUserAAPL)) + ')'
            )
            console.log('- Protocol AAPL:', ethers.utils.formatEther(protocolAAPL))

            // Show repayment info
            const totalRepayment = loan.loanAmount.add(loan.interestRate)
            console.log('\n💳 Repayment Information:')
            console.log('- Total to repay:', ethers.utils.formatEther(totalRepayment), 'USDC')
            console.log('- Repayment command:')
            console.log(`  npx hardhat stock-lend:repay-loan --loanid ${loanId} --network sepolia`)

            console.log('\n🎉 StockLend Protocol Demo Complete!')
            console.log('✅ Loan successfully created and funded')
            console.log('✅ Collateral locked in protocol')
            console.log('✅ USDC disbursed to borrower')
            console.log('✅ Ready for repayment or liquidation')
        }
    } catch (error) {
        console.error('❌ Error:', error)
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
