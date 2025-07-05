import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { StockLendProtocol, StockToken } from '../../typechain-types'

describe('StockLend Protocol', function () {
    let stockLendProtocol: StockLendProtocol
    let stockTokenAAPL: StockToken
    let stockTokenTSLA: StockToken
    let mockUSDC: StockToken
    let owner: SignerWithAddress
    let borrower: SignerWithAddress
    let treasury: SignerWithAddress

    beforeEach(async function () {
        ;[owner, borrower, treasury] = await ethers.getSigners()

        // Deploy mock USDC
        const StockToken = await ethers.getContractFactory('StockToken')
        mockUSDC = await StockToken.deploy('Mock USDC', 'mUSDC', 'USDC', 'USD Coin', owner.address)

        // Deploy stock tokens
        stockTokenAAPL = await StockToken.deploy('Apple Stock Token', 'sAAPL', 'AAPL', 'Apple Inc.', owner.address)

        stockTokenTSLA = await StockToken.deploy('Tesla Stock Token', 'sTSLA', 'TSLA', 'Tesla Inc.', owner.address)

        // Deploy StockLend Protocol
        const StockLendProtocol = await ethers.getContractFactory('StockLendProtocol')
        stockLendProtocol = await StockLendProtocol.deploy(mockUSDC.address, treasury.address, owner.address)

        // Setup initial state
        await mockUSDC.authorizeMinter(owner.address)
        await stockTokenAAPL.authorizeMinter(owner.address)
        await stockTokenTSLA.authorizeMinter(owner.address)

        // Mint tokens
        await mockUSDC.mint(treasury.address, ethers.utils.parseEther('1000000'), 'Initial supply')
        await stockTokenAAPL.mint(borrower.address, ethers.utils.parseEther('100'), 'Initial supply')
        await stockTokenTSLA.mint(borrower.address, ethers.utils.parseEther('50'), 'Initial supply')

        // Add stock assets
        await stockLendProtocol.addStockAsset(
            stockTokenAAPL.address,
            '0x0000000000000000000000000000000000000000',
            7500 // 75% LTV
        )

        await stockLendProtocol.addStockAsset(
            stockTokenTSLA.address,
            '0x0000000000000000000000000000000000000000',
            7000 // 70% LTV
        )

        // Approve protocol to spend treasury USDC
        await mockUSDC.connect(treasury).approve(stockLendProtocol.address, ethers.constants.MaxUint256)
    })

    describe('Deployment', function () {
        it('Should set the correct initial parameters', async function () {
            expect(await stockLendProtocol.USDC()).to.equal(mockUSDC.address)
            expect(await stockLendProtocol.treasury()).to.equal(treasury.address)
            expect(await stockLendProtocol.owner()).to.equal(owner.address)
        })
    })

    describe('Stock Asset Management', function () {
        it('Should add stock assets correctly', async function () {
            const asset = await stockLendProtocol.stockAssets(stockTokenAAPL.address)
            expect(asset.token).to.equal(stockTokenAAPL.address)
            expect(asset.ltv).to.equal(7500)
            expect(asset.isActive).to.be.true
        })

        it('Should reject LTV above maximum', async function () {
            const StockToken = await ethers.getContractFactory('StockToken')
            const newToken = await StockToken.deploy('Test', 'TEST', 'TEST', 'Test', owner.address)

            await expect(
                stockLendProtocol.addStockAsset(
                    newToken.address,
                    '0x0000000000000000000000000000000000000000',
                    9000 // 90% LTV - above MAX_LTV
                )
            ).to.be.revertedWith('LTV too high')
        })
    })

    describe('Loan Creation', function () {
        beforeEach(async function () {
            // Approve stock tokens for borrower
            await stockTokenAAPL.connect(borrower).approve(stockLendProtocol.address, ethers.constants.MaxUint256)
        })

        it('Should create a loan successfully', async function () {
            const collateralAmount = ethers.utils.parseEther('10') // 10 AAPL tokens
            const loanAmount = ethers.utils.parseEther('500') // $500 USDC
            const duration = 30 * 24 * 60 * 60 // 30 days

            const tx = await stockLendProtocol
                .connect(borrower)
                .createLoan(stockTokenAAPL.address, collateralAmount, loanAmount, duration)

            const receipt = await tx.wait()
            const loanCreatedEvent = receipt.events?.find((e) => e.event === 'LoanCreated')

            expect(loanCreatedEvent).to.not.be.undefined
            expect(loanCreatedEvent?.args?.borrower).to.equal(borrower.address)
            expect(loanCreatedEvent?.args?.stockToken).to.equal(stockTokenAAPL.address)
            expect(loanCreatedEvent?.args?.loanAmount).to.equal(loanAmount)

            // Check loan details
            const loan = await stockLendProtocol.getLoan(0)
            expect(loan.borrower).to.equal(borrower.address)
            expect(loan.stockToken).to.equal(stockTokenAAPL.address)
            expect(loan.collateralAmount).to.equal(collateralAmount)
            expect(loan.loanAmount).to.equal(loanAmount)
            expect(loan.isActive).to.be.true
            expect(loan.putExercised).to.be.false
        })

        it('Should reject loan for unsupported stock', async function () {
            const StockToken = await ethers.getContractFactory('StockToken')
            const unsupportedToken = await StockToken.deploy(
                'Unsupported',
                'UNSUP',
                'UNSUP',
                'Unsupported',
                owner.address
            )

            await expect(
                stockLendProtocol
                    .connect(borrower)
                    .createLoan(
                        unsupportedToken.address,
                        ethers.utils.parseEther('10'),
                        ethers.utils.parseEther('500'),
                        30 * 24 * 60 * 60
                    )
            ).to.be.revertedWith('Stock not supported')
        })

        it('Should reject loan with high LTV', async function () {
            const collateralAmount = ethers.utils.parseEther('10') // 10 AAPL tokens
            const loanAmount = ethers.utils.parseEther('900') // $900 USDC - too high for 75% LTV
            const duration = 30 * 24 * 60 * 60

            await expect(
                stockLendProtocol
                    .connect(borrower)
                    .createLoan(stockTokenAAPL.address, collateralAmount, loanAmount, duration)
            ).to.be.revertedWith('LTV too high')
        })

        it('Should transfer collateral and USDC correctly', async function () {
            const collateralAmount = ethers.utils.parseEther('10')
            const loanAmount = ethers.utils.parseEther('500')
            const duration = 30 * 24 * 60 * 60

            const borrowerAAPLBefore = await stockTokenAAPL.balanceOf(borrower.address)
            const borrowerUSDCBefore = await mockUSDC.balanceOf(borrower.address)
            const protocolAAPLBefore = await stockTokenAAPL.balanceOf(stockLendProtocol.address)

            await stockLendProtocol
                .connect(borrower)
                .createLoan(stockTokenAAPL.address, collateralAmount, loanAmount, duration)

            const borrowerAAPLAfter = await stockTokenAAPL.balanceOf(borrower.address)
            const borrowerUSDCAfter = await mockUSDC.balanceOf(borrower.address)
            const protocolAAPLAfter = await stockTokenAAPL.balanceOf(stockLendProtocol.address)

            // Check collateral transfer
            expect(borrowerAAPLAfter).to.equal(borrowerAAPLBefore.sub(collateralAmount))
            expect(protocolAAPLAfter).to.equal(protocolAAPLBefore.add(collateralAmount))

            // Check USDC transfer
            expect(borrowerUSDCAfter).to.equal(borrowerUSDCBefore.add(loanAmount))
        })
    })

    describe('Loan Repayment', function () {
        let loanId: number

        beforeEach(async function () {
            // Create a loan first
            await stockTokenAAPL.connect(borrower).approve(stockLendProtocol.address, ethers.constants.MaxUint256)
            await stockLendProtocol
                .connect(borrower)
                .createLoan(
                    stockTokenAAPL.address,
                    ethers.utils.parseEther('10'),
                    ethers.utils.parseEther('500'),
                    30 * 24 * 60 * 60
                )
            loanId = 0

            // Approve USDC for repayment
            await mockUSDC.connect(borrower).approve(stockLendProtocol.address, ethers.constants.MaxUint256)
        })

        it('Should repay loan successfully', async function () {
            const loan = await stockLendProtocol.getLoan(loanId)
            const repayAmount = loan.loanAmount.add(loan.interestRate)

            const borrowerAAPLBefore = await stockTokenAAPL.balanceOf(borrower.address)
            const borrowerUSDCBefore = await mockUSDC.balanceOf(borrower.address)

            await stockLendProtocol.connect(borrower).repayLoan(loanId)

            const borrowerAAPLAfter = await stockTokenAAPL.balanceOf(borrower.address)
            const borrowerUSDCAfter = await mockUSDC.balanceOf(borrower.address)

            // Check collateral return
            expect(borrowerAAPLAfter).to.equal(borrowerAAPLBefore.add(loan.collateralAmount))

            // Check USDC payment
            expect(borrowerUSDCAfter).to.equal(borrowerUSDCBefore.sub(repayAmount))

            // Check loan is inactive
            const updatedLoan = await stockLendProtocol.getLoan(loanId)
            expect(updatedLoan.isActive).to.be.false
        })

        it('Should reject repayment by non-borrower', async function () {
            await expect(stockLendProtocol.connect(owner).repayLoan(loanId)).to.be.revertedWith('Not borrower')
        })

        it('Should reject repayment of inactive loan', async function () {
            // Repay loan first
            await stockLendProtocol.connect(borrower).repayLoan(loanId)

            // Try to repay again
            await expect(stockLendProtocol.connect(borrower).repayLoan(loanId)).to.be.revertedWith('Loan not active')
        })
    })

    describe('User Loan Tracking', function () {
        it('Should track user loans correctly', async function () {
            await stockTokenAAPL.connect(borrower).approve(stockLendProtocol.address, ethers.constants.MaxUint256)

            // Create two loans
            await stockLendProtocol
                .connect(borrower)
                .createLoan(
                    stockTokenAAPL.address,
                    ethers.utils.parseEther('5'),
                    ethers.utils.parseEther('250'),
                    30 * 24 * 60 * 60
                )

            await stockLendProtocol
                .connect(borrower)
                .createLoan(
                    stockTokenAAPL.address,
                    ethers.utils.parseEther('3'),
                    ethers.utils.parseEther('150'),
                    30 * 24 * 60 * 60
                )

            const userLoans = await stockLendProtocol.getUserLoans(borrower.address)
            expect(userLoans.length).to.equal(2)
            expect(userLoans[0]).to.equal(0)
            expect(userLoans[1]).to.equal(1)
        })
    })

    describe('Put Option Protection', function () {
        it('Should calculate put strike correctly', async function () {
            await stockTokenAAPL.connect(borrower).approve(stockLendProtocol.address, ethers.constants.MaxUint256)

            await stockLendProtocol
                .connect(borrower)
                .createLoan(
                    stockTokenAAPL.address,
                    ethers.utils.parseEther('10'),
                    ethers.utils.parseEther('500'),
                    30 * 24 * 60 * 60
                )

            const loan = await stockLendProtocol.getLoan(0)
            const currentPrice = ethers.utils.parseEther('100') // $100 per token
            const expectedPutStrike = currentPrice.mul(10000 - 500).div(10000) // 95% of current price

            expect(loan.putStrike).to.equal(expectedPutStrike)
        })
    })
})
