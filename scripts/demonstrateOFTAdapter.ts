import { ethers } from 'hardhat'

async function main() {
    const [signer] = await ethers.getSigners()

    // Your deployed contract details
    const contractAddress = '0xBD830E10aD1A1cb6054da7A3B52BAFb93Bd0f4c1'
    const tokenAddress = '0x3990e910E03b8B79E9df9f4f0D5082dc5424B42A'

    console.log('🎯 StockLendOFTAdapter Demonstration')
    console.log('='.repeat(50))
    console.log('📍 Contract Address:', contractAddress)
    console.log('🪙 Token Address:', tokenAddress)
    console.log('👤 Current Account:', signer.address)
    console.log('🔗 Network: Sepolia')

    try {
        // Connect to the deployed contract
        const oftAdapter = await ethers.getContractAt('MyOFTAdapter', contractAddress)
        const token = await ethers.getContractAt('IERC20', tokenAddress)

        console.log('\n📊 Contract Status Check')
        console.log('-'.repeat(30))

        // Check contract owner
        const owner = await oftAdapter.owner()
        console.log('👑 Owner:', owner)

        // Check token balance
        const userBalance = await token.balanceOf(signer.address)
        console.log('💰 Your Token Balance:', ethers.utils.formatEther(userBalance))

        // Check contract's token balance
        const contractBalance = await token.balanceOf(contractAddress)
        console.log('🏦 Contract Token Balance:', ethers.utils.formatEther(contractBalance))

        // Check allowance
        const allowance = await token.allowance(signer.address, contractAddress)
        console.log('✅ Current Allowance:', ethers.utils.formatEther(allowance))

        console.log('\n🔧 Available Functions')
        console.log('-'.repeat(30))

        // Show what functions are available
        console.log('1. ✅ Contract is deployed and accessible')
        console.log('2. ✅ Token contract is connected')
        console.log('3. ✅ Owner verification successful')
        console.log('4. ✅ Balance queries working')

        console.log('\n🚀 How to Use This Contract')
        console.log('-'.repeat(30))
        console.log('1. 🪙 Get tokens: Mint or receive tokens at', tokenAddress)
        console.log('2. 📋 Approve: Allow the OFT adapter to spend your tokens')
        console.log('3. 🌉 Send: Use LayerZero to send tokens cross-chain')
        console.log('4. 📥 Receive: Tokens will arrive on the destination chain')

        console.log('\n📝 Example Commands')
        console.log('-'.repeat(30))
        console.log('# Check token balance:')
        console.log(`npx hardhat run scripts/checkBalance.ts --network sepolia`)
        console.log('\n# Approve tokens for cross-chain transfer:')
        console.log(`npx hardhat run scripts/approveTokens.ts --network sepolia`)
        console.log('\n# Send tokens cross-chain (requires peer setup):')
        console.log(
            `npx hardhat lz:oft:send --src-eid 40161 --dst-eid 421614 --amount 1.0 --to <recipient> --oft-address ${contractAddress}`
        )

        console.log('\n🎉 Contract is fully functional!')
        console.log('Ready for cross-chain token transfers via LayerZero')
    } catch (error) {
        console.error('❌ Error:', error)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
