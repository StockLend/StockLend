import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { StockLendProtocolV3, MyERC20Mock, MockPriceFeed } from '../../typechain-types'

describe('StockLendProtocolV3', function () {
    let protocolV3: StockLendProtocolV3
    let mockUSDC: MyERC20Mock
    let stockToken: MyERC20Mock
    let priceFeed: MockPriceFeed
    let owner: SignerWithAddress
    let borrower: SignerWithAddress
    let treasury: SignerWithAddress

    beforeEach(async function () {
        ;[owner, borrower, treasury] = await ethers.getSigners()

        // Deploy mock USDC
        const MyERC20Mock = await ethers.getContractFactory('MyERC20Mock')
        mockUSDC = await MyERC20Mock.deploy('USD Coin', 'USDC')
        await mockUSDC.deployed()

        // Deploy V3 Protocol
        const StockLendProtocolV3 = await ethers.getContractFactory('StockLendProtocolV3')
        protocolV3 = await StockLendProtocolV3.deploy(mockUSDC.address, treasury.address, owner.address)
        await protocolV3.deployed()

        // Deploy stock token
        stockToken = await MyERC20Mock.deploy('Apple Inc Stock', 'AAPL')
        await stockToken.deployed()

        // Deploy price feed
        const MockPriceFeed = await ethers.getContractFactory('MockPriceFeed')
        priceFeed = await MockPriceFeed.deploy(200 * 10 ** 8) // $200
        await priceFeed.deployed()

        // Add stock asset
        await protocolV3.addStockAssetV3(
            stockToken.address,
            priceFeed.address,
            ethers.constants.AddressZero, // No volatility feed
            7500, // 75% LTV
            false // Use default volatility
        )

        // Fund treasury
        const treasuryAmount = ethers.utils.parseEther('100000')
        await mockUSDC.mint(treasury.address, treasuryAmount)
        await mockUSDC.connect(treasury).approve(protocolV3.address, treasuryAmount)

        // Initialize protection fund
        const protectionAmount = ethers.utils.parseEther('10000')
        await mockUSDC.mint(owner.address, protectionAmount)
        await mockUSDC.approve(protocolV3.address, protectionAmount)
        await protocolV3.depositProtectionFund(protectionAmount)
    })

    describe('Deployment', function () {
        it('Should set correct initial parameters', async function () {
            expect(await protocolV3.USDC()).to.equal(mockUSDC.address)
            expect(await protocolV3.treasury()).to.equal(treasury.address)
            expect(await protocolV3.owner()).to.equal(owner.address)
        })

        it('Should have correct yield constants', async function () {
            const stats = await protocolV3.getProtocolStats()
            expect(stats.baseYieldRate).to.equal(ethers.utils.parseEther('0.0375')) // 3.75%
        })
    })

    describe('Black-Scholes Calculations', function () {
        it('Should calculate put premium correctly', async function () {
            const spot = 200 * 10 ** 8 // $200
            const strike = 190 * 10 ** 8 // $190
            const timeToMaturity = ethers.utils.parseEther('0.25') // 3 months
            const volatility = ethers.utils.parseEther('0.3') // 30%

            const premium = await protocolV3.calculatePutPremium(spot, strike, timeToMaturity, volatility)

            // Premium should be reasonable (between $1-20 for this scenario)
            expect(premium).to.be.gt(1 * 10 ** 8)
            expect(premium).to.be.lt(20 * 10 ** 8)
        })

        it('Should handle edge cases in premium calculation', async function () {
            // At-the-money option
            const spot = 200 * 10 ** 8
            const strike = 200 * 10 ** 8
            const timeToMaturity = ethers.utils.parseEther('0.25')
            const volatility = ethers.utils.parseEther('0.3')

            const premium = await protocolV3.calculatePutPremium(spot, strike, timeToMaturity, volatility)

            expect(premium).to.be.gt(0)
        })

        it('Should calculate higher premium for higher volatility', async function () {
            const spot = 200 * 10 ** 8
            const strike = 190 * 10 ** 8
            const timeToMaturity = ethers.utils.parseEther('0.25')

            const lowVolPremium = await protocolV3.calculatePutPremium(
                spot,
                strike,
                timeToMaturity,
                ethers.utils.parseEther('0.2') // 20%
            )

            const highVolPremium = await protocolV3.calculatePutPremium(
                spot,
                strike,
                timeToMaturity,
                ethers.utils.parseEther('0.5') // 50%
            )

            expect(highVolPremium).to.be.gt(lowVolPremium)
        })
    })

    describe('Loan Creation V3', function () {
        beforeEach(async function () {
            // Mint tokens for borrower
            const collateralAmount = ethers.utils.parseEther('100')
            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)
        })

        it('Should create loan with dynamic pricing', async function () {
            const collateralAmount = ethers.utils.parseEther('100') // 100 AAPL
            const loanAmount = ethers.utils.parseEther('15000') // $15,000
            const duration = 90 * 24 * 60 * 60 // 90 days

            const tx = await protocolV3
                .connect(borrower)
                .createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()
            const loanEvent = receipt.events?.find((e) => e.event === 'LoanV3Created')
            expect(loanEvent).to.exist

            const loanId = loanEvent?.args?.loanId
            const loanDetails = await protocolV3.getLoanDetails(loanId)

            expect(loanDetails.loan.borrower).to.equal(borrower.address)
            expect(loanDetails.loan.loanAmount).to.equal(loanAmount)
            expect(loanDetails.loan.putStrike).to.be.gt(0)
            expect(loanDetails.loan.putPremium).to.be.gt(0)
            expect(loanDetails.loan.targetYield).to.be.gt(0)
        })

        it('Should calculate correct yield structure', async function () {
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000') // $10,000
            const duration = 90 * 24 * 60 * 60 // 90 days

            const tx = await protocolV3
                .connect(borrower)
                .createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()
            const yieldEvent = receipt.events?.find((e) => e.event === 'YieldCalculated')
            expect(yieldEvent).to.exist

            const baseYield = yieldEvent?.args?.baseYield
            const premiumYield = yieldEvent?.args?.premiumYield
            const totalYield = yieldEvent?.args?.totalYield

            // Base yield should be ~3.75% * 0.25 years * $10,000 = ~$93.75
            expect(baseYield).to.be.closeTo(
                ethers.utils.parseEther('93.75'),
                ethers.utils.parseEther('10') // 10% tolerance
            )

            // Premium yield should be 70% of base yield
            expect(premiumYield).to.be.closeTo(
                baseYield.mul(70).div(100),
                ethers.utils.parseEther('5') // Small tolerance
            )

            // Total yield should be sum of base and premium
            expect(totalYield).to.equal(baseYield.add(premiumYield))
        })

        it('Should reject invalid loan parameters', async function () {
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('20000') // Too high LTV
            const duration = 90 * 24 * 60 * 60

            await expect(
                protocolV3.connect(borrower).createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)
            ).to.be.revertedWith('LTV too high')
        })

        it('Should reject invalid duration', async function () {
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const shortDuration = 5 * 24 * 60 * 60 // 5 days - too short

            await expect(
                protocolV3
                    .connect(borrower)
                    .createLoanV3(stockToken.address, collateralAmount, loanAmount, shortDuration)
            ).to.be.revertedWith('Invalid duration')
        })
    })

    describe('Loan Repayment V3', function () {
        let loanId: any

        beforeEach(async function () {
            // Create a loan first
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const duration = 90 * 24 * 60 * 60

            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)

            const tx = await protocolV3
                .connect(borrower)
                .createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()
            const loanEvent = receipt.events?.find((e) => e.event === 'LoanV3Created')
            loanId = loanEvent?.args?.loanId
        })

        it('Should repay loan correctly', async function () {
            const loanDetails = await protocolV3.getLoanDetails(loanId)
            const repayAmount = loanDetails.loan.loanAmount.add(loanDetails.loan.targetYield)

            // Fund borrower with USDC for repayment
            await mockUSDC.mint(borrower.address, repayAmount)
            await mockUSDC.connect(borrower).approve(protocolV3.address, repayAmount)

            // Repay loan
            await protocolV3.connect(borrower).repayLoanV3(loanId)

            // Check loan status
            const updatedLoan = await protocolV3.loans(loanId)
            expect(updatedLoan.isActive).to.be.false

            // Check borrower got collateral back
            const borrowerBalance = await stockToken.balanceOf(borrower.address)
            expect(borrowerBalance).to.equal(loanDetails.loan.collateralAmount)
        })

        it('Should reject repayment from non-borrower', async function () {
            await expect(protocolV3.connect(owner).repayLoanV3(loanId)).to.be.revertedWith('Not borrower')
        })
    })

    describe('Put Option Protection', function () {
        let loanId: any

        beforeEach(async function () {
            // Create a loan
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const duration = 90 * 24 * 60 * 60

            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)

            const tx = await protocolV3
                .connect(borrower)
                .createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()
            const loanEvent = receipt.events?.find((e) => e.event === 'LoanV3Created')
            loanId = loanEvent?.args?.loanId
        })

        it('Should detect when put option should be exercised', async function () {
            // Drop price below strike
            await priceFeed.setPrice(150 * 10 ** 8) // $150, below strike

            const loanDetails = await protocolV3.getLoanDetails(loanId)
            expect(loanDetails.shouldExercise).to.be.true
            expect(loanDetails.intrinsicValue).to.be.gt(0)
        })

        it('Should not exercise put when price is above strike', async function () {
            // Keep price above strike
            await priceFeed.setPrice(220 * 10 ** 8) // $220, above strike

            const loanDetails = await protocolV3.getLoanDetails(loanId)
            expect(loanDetails.shouldExercise).to.be.false
            expect(loanDetails.intrinsicValue).to.equal(0)
        })

        it('Should calculate intrinsic value correctly', async function () {
            const loanDetails = await protocolV3.getLoanDetails(loanId)
            const putStrike = loanDetails.loan.putStrike
            const collateralAmount = loanDetails.loan.collateralAmount

            // Set price below strike
            const newPrice = 170 * 10 ** 8 // $170
            await priceFeed.setPrice(newPrice)

            const updatedDetails = await protocolV3.getLoanDetails(loanId)
            const expectedIntrinsicValue = putStrike
                .sub(newPrice)
                .mul(collateralAmount)
                .div(10 ** 8)

            expect(updatedDetails.intrinsicValue).to.be.closeTo(
                expectedIntrinsicValue,
                ethers.utils.parseEther('1') // Small tolerance
            )
        })
    })

    describe('Protocol Statistics', function () {
        it('Should track protocol stats correctly', async function () {
            const stats = await protocolV3.getProtocolStats()

            expect(stats.totalProtectionFund).to.equal(ethers.utils.parseEther('10000'))
            expect(stats.totalActiveLoans).to.equal(0)
            expect(stats.baseYieldRate).to.equal(ethers.utils.parseEther('0.0375'))
        })

        it('Should update stats after loan creation', async function () {
            // Create a loan
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const duration = 90 * 24 * 60 * 60

            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)

            await protocolV3.connect(borrower).createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const stats = await protocolV3.getProtocolStats()
            expect(stats.totalActiveLoans).to.equal(1)
            expect(stats.totalProtocolFees).to.be.gt(0)
        })
    })

    describe('Admin Functions', function () {
        it('Should allow owner to withdraw protocol fees', async function () {
            // Create a loan to generate fees
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const duration = 90 * 24 * 60 * 60

            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)

            await protocolV3.connect(borrower).createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const statsBefore = await protocolV3.getProtocolStats()
            const feesBefore = statsBefore.totalProtocolFees

            // Withdraw fees
            await protocolV3.withdrawProtocolFees()

            const statsAfter = await protocolV3.getProtocolStats()
            expect(statsAfter.totalProtocolFees).to.equal(0)

            // Check owner received fees
            const ownerBalance = await mockUSDC.balanceOf(owner.address)
            expect(ownerBalance).to.be.gte(feesBefore)
        })

        it('Should reject non-owner admin actions', async function () {
            await expect(protocolV3.connect(borrower).withdrawProtocolFees()).to.be.revertedWith(
                'Ownable: caller is not the owner'
            )
        })
    })

    describe('Gas Optimization', function () {
        it('Should create loan with reasonable gas cost', async function () {
            const collateralAmount = ethers.utils.parseEther('100')
            const loanAmount = ethers.utils.parseEther('10000')
            const duration = 90 * 24 * 60 * 60

            await stockToken.mint(borrower.address, collateralAmount)
            await stockToken.connect(borrower).approve(protocolV3.address, collateralAmount)

            const tx = await protocolV3
                .connect(borrower)
                .createLoanV3(stockToken.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()

            // Gas should be less than 200k (target is <150k)
            expect(receipt.gasUsed).to.be.lt(200000)
            console.log('Gas used for loan creation:', receipt.gasUsed.toString())
        })
    })
})
