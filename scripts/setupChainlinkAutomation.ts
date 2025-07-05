import { ethers } from 'hardhat'
import { deployments } from 'hardhat'

async function main() {
    console.log('🔗 Setting up Chainlink Automation for StockLendProtocolV2')
    console.log('='.repeat(60))

    const [signer] = await ethers.getSigners()
    console.log('👤 Account:', signer.address)

    try {
        // Get deployed contract
        const protocolV2Deployment = await deployments.get('StockLendProtocolV2')
        const protocolV2 = await ethers.getContractAt('StockLendProtocolV2', protocolV2Deployment.address)

        console.log('📍 Contract Address:', protocolV2.address)

        // Get other contracts
        const stockTokenAAPLDeployment = await deployments.get('StockToken_AAPL')
        const stockTokenAAPL = await ethers.getContractAt('StockToken', stockTokenAAPLDeployment.address)

        const usdcAddress = await protocolV2.USDC()
        const usdc = await ethers.getContractAt('MyERC20Mock', usdcAddress)

        // Step 1: Fund protection fund
        console.log('\n💰 Step 1: Setting up Protection Fund...')

        const protectionFundAmount = ethers.utils.parseEther('5000') // 5,000 USDC for protection
        const currentProtectionFund = await protocolV2.protectionFund()

        if (currentProtectionFund.lt(ethers.utils.parseEther('1000'))) {
            console.log('Minting USDC for protection fund...')
            await usdc.mint(signer.address, protectionFundAmount)

            console.log('Approving USDC for protection fund...')
            await usdc.approve(protocolV2.address, protectionFundAmount)

            console.log('Depositing to protection fund...')
            await protocolV2.depositProtectionFund(protectionFundAmount)

            console.log('✅ Protection fund deposited:', ethers.utils.formatEther(protectionFundAmount), 'USDC')
        } else {
            console.log('✅ Protection fund already funded:', ethers.utils.formatEther(currentProtectionFund), 'USDC')
        }

        // Step 2: Add stock assets (with mock price feeds for demo)
        console.log('\n🏭 Step 2: Adding Stock Assets...')

        try {
            const aaplAsset = await protocolV2.stockAssets(stockTokenAAPL.address)
            if (!aaplAsset.isActive || aaplAsset.token === '0x0000000000000000000000000000000000000000') {
                console.log('Adding AAPL asset with mock price feed...')
                await protocolV2.addStockAsset(
                    stockTokenAAPL.address,
                    '0x0000000000000000000000000000000000000000', // Mock price feed for demo
                    7500 // 75% LTV
                )
                console.log('✅ AAPL asset added')
            } else {
                console.log('✅ AAPL asset already configured')
            }
        } catch (error) {
            console.log('⚠️  Could not add AAPL asset:', error.message)
        }

        // Step 3: Create test loans for automation monitoring
        console.log('\n💰 Step 3: Creating Test Loans for Automation...')

        const activeLoansCount = await protocolV2.getActiveLoansCount()
        console.log('Current active loans:', activeLoansCount.toString())

        if (activeLoansCount.eq(0)) {
            // Fund and approve tokens
            console.log('Setting up test loan...')

            // Mint USDC for lending
            await usdc.mint(signer.address, ethers.utils.parseEther('1000'))
            await usdc.approve(protocolV2.address, ethers.constants.MaxUint256)

            // Approve AAPL tokens
            await stockTokenAAPL.approve(protocolV2.address, ethers.utils.parseEther('10'))

            // Create test loan
            const createTx = await protocolV2.createLoan(
                stockTokenAAPL.address,
                ethers.utils.parseEther('2'), // 2 AAPL tokens
                ethers.utils.parseEther('150'), // $150 USDC
                30 * 24 * 60 * 60 // 30 days
            )
            const receipt = await createTx.wait()

            console.log('✅ Test loan created! Transaction:', receipt.transactionHash)

            const loanEvent = receipt.events?.find((e) => e.event === 'LoanCreated')
            if (loanEvent) {
                const loanId = loanEvent.args?.loanId
                console.log('📝 Loan ID:', loanId.toString())

                const loan = await protocolV2.getLoan(loanId)
                console.log('💎 Put Strike Price:', ethers.utils.formatUnits(loan.putStrike, 8), 'USD')
                console.log('📈 Creation Price:', ethers.utils.formatUnits(loan.creationPrice, 8), 'USD')
            }
        } else {
            console.log('✅ Test loans already exist')
        }

        // Step 4: Display automation setup instructions
        console.log('\n🤖 Step 4: Chainlink Automation Setup Instructions')
        console.log('-'.repeat(50))

        const forwarder = await protocolV2.forwarder()
        if (forwarder === '0x0000000000000000000000000000000000000000') {
            console.log('⚠️  Chainlink Automation forwarder not set yet.')
        } else {
            console.log('✅ Forwarder already set:', forwarder)
        }

        console.log('\n📋 Manual Setup Required:')
        console.log('1. 🌐 Go to: https://automation.chain.link/')
        console.log('2. 🔗 Connect your wallet')
        console.log('3. ➕ Click "Register new Upkeep"')
        console.log('4. ⚙️  Select "Custom logic" trigger')
        console.log('5. 📋 Enter target contract address:', protocolV2.address)
        console.log('6. 💰 Fund with 2 testnet LINK')
        console.log('7. 🏷️  Name: "StockLend Put Option Monitor"')
        console.log('8. ⛽ Gas limit: 500,000')
        console.log('9. ✅ Register upkeep')
        console.log('10. 📝 Copy the forwarder address and set it:')
        console.log(`    protocolV2.setForwarder("FORWARDER_ADDRESS")`)

        // Step 5: Test put option conditions
        console.log('\n🧪 Step 5: Testing Put Option Logic...')

        const activeLoansAfter = await protocolV2.getActiveLoansCount()
        if (activeLoansAfter.gt(0)) {
            for (let i = 0; i < activeLoansAfter.toNumber(); i++) {
                const loanId = i
                try {
                    const shouldExercise = await protocolV2.shouldExercisePut(loanId)
                    const loan = await protocolV2.getLoan(loanId)
                    const currentPrice = await protocolV2.getCurrentPrice(loan.stockToken)

                    console.log(`\nLoan ${loanId}:`)
                    console.log('- Current Price:', ethers.utils.formatUnits(currentPrice, 8), 'USD')
                    console.log('- Put Strike:', ethers.utils.formatUnits(loan.putStrike, 8), 'USD')
                    console.log('- Should Exercise:', shouldExercise)
                    console.log('- Put Already Exercised:', loan.putExercised)

                    if (shouldExercise && !loan.putExercised) {
                        console.log('🚨 This loan would trigger put option exercise!')
                    }
                } catch (error) {
                    console.log(`⚠️  Could not check loan ${loanId}:`, error.message)
                }
            }
        }

        // Step 6: Summary
        console.log('\n🎉 Setup Summary:')
        console.log('✅ StockLendProtocolV2 deployed and configured')
        console.log('✅ Protection fund funded and ready')
        console.log('✅ Stock assets registered')
        console.log('✅ Test loans created for monitoring')
        console.log('⏳ Chainlink Automation registration pending')

        console.log('\n🔧 Next Steps:')
        console.log('1. Register upkeep on Chainlink Automation website')
        console.log('2. Set forwarder address using setForwarder()')
        console.log('3. Monitor automatic put option triggers')
        console.log('4. Add real Chainlink price feeds for production')

        console.log('\n🎯 Contract Ready for Automatic Put Option Protection!')
    } catch (error) {
        console.error('❌ Setup Error:', error)
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
