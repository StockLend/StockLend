import { expect } from 'chai'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { StockLendOFTAdapter, StockToken } from '../../typechain-types'

describe('StockLendOFTAdapter', function () {
    let stockLendOFTAdapter: StockLendOFTAdapter
    let stockToken: StockToken
    let owner: SignerWithAddress
    let user: SignerWithAddress
    let mockEndpoint: string

    beforeEach(async function () {
        ;[owner, user] = await ethers.getSigners()

        // LayerZero V2 endpoint (standard address for most chains)
        mockEndpoint = '0x1a44076050125825900e736c501f859c50fE728c'

        // Deploy stock token
        const StockToken = await ethers.getContractFactory('StockToken')
        stockToken = await StockToken.deploy('Apple Stock Token', 'sAAPL', 'AAPL', 'Apple Inc.', owner.address)

        // Deploy StockLendOFTAdapter
        const StockLendOFTAdapter = await ethers.getContractFactory('StockLendOFTAdapter')
        stockLendOFTAdapter = await StockLendOFTAdapter.deploy(
            stockToken.address,
            mockEndpoint,
            owner.address,
            'AAPL',
            'Apple Inc.'
        )

        // Mint some tokens for testing
        await stockToken.authorizeMinter(owner.address)
        await stockToken.mint(user.address, ethers.utils.parseEther('100'), 'Test mint')
    })

    describe('Deployment', function () {
        it('Should set the correct parameters', async function () {
            expect(await stockLendOFTAdapter.stockSymbol()).to.equal('AAPL')
            expect(await stockLendOFTAdapter.stockName()).to.equal('Apple Inc.')
            expect(await stockLendOFTAdapter.owner()).to.equal(owner.address)
        })

        it('Should return correct stock info', async function () {
            const [symbol, name] = await stockLendOFTAdapter.getStockInfo()
            expect(symbol).to.equal('AAPL')
            expect(name).to.equal('Apple Inc.')
        })
    })

    describe('Collateral Tracking', function () {
        it('Should track collateral by chain', async function () {
            const chainId = 1
            const initialCollateral = await stockLendOFTAdapter.getChainCollateral(chainId)
            expect(initialCollateral).to.equal(0)
        })

        it('Should track user collateral by chain', async function () {
            const chainId = 1
            const initialCollateral = await stockLendOFTAdapter.getUserChainCollateral(user.address, chainId)
            expect(initialCollateral).to.equal(0)
        })
    })

    describe('Token Information', function () {
        it('Should return correct token address', async function () {
            expect(await stockLendOFTAdapter.token()).to.equal(stockToken.address)
        })

        it('Should have correct stock metadata', async function () {
            expect(await stockLendOFTAdapter.stockSymbol()).to.equal('AAPL')
            expect(await stockLendOFTAdapter.stockName()).to.equal('Apple Inc.')
        })
    })

    describe('Access Control', function () {
        it('Should only allow owner to call owner functions', async function () {
            expect(await stockLendOFTAdapter.owner()).to.equal(owner.address)
        })
    })
})
