import { ethers } from 'hardhat'
import { deployments } from 'hardhat'

async function main() {
    console.log('🚀 Quick StockLend Loan Creation')

    const [signer] = await ethers.getSigners()

    // Get contracts
    const stockLendProtocol = await ethers.getContractAt(
        'StockLendProtocol',
        '0x25833b02b4c212e1098A18D45fe9e70b43153599'
    )
    const stockTokenAAPL = await ethers.getContractAt('StockToken', '0x09a3166e73D34116d833480a235071f1f98894E2')
    const usdc = await ethers.getContractAt('MyERC20Mock', '0x3990e910E03b8B79E9df9f4f0D5082dc5424B42A')

    // Step 1: Mint USDC for treasury funding
    console.log('💰 Minting USDC...')
    await usdc.mint(signer.address, ethers.utils.parseEther('1000'))

    // Step 2: Approve protocol to spend USDC
    console.log('🔐 Approving USDC...')
    await usdc.approve(stockLendProtocol.address, ethers.constants.MaxUint256)

    // Step 3: Approve AAPL tokens
    console.log('🔐 Approving AAPL...')
    await stockTokenAAPL.approve(stockLendProtocol.address, ethers.utils.parseEther('10'))

    // Step 4: Create loan
    console.log('💰 Creating loan...')
    const tx = await stockLendProtocol.createLoan(
        stockTokenAAPL.address,
        ethers.utils.parseEther('1'), // 1 AAPL
        ethers.utils.parseEther('50'), // $50 USDC
        2592000 // 30 days
    )
    const receipt = await tx.wait()

    console.log('✅ SUCCESS! Loan created!')
    console.log('Transaction:', receipt.transactionHash)

    // Get loan ID
    const event = receipt.events?.find((e) => e.event === 'LoanCreated')
    if (event) {
        console.log('📝 Loan ID:', event.args?.loanId.toString())
    }
}

main().catch(console.error)
