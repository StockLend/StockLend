import { ethers } from 'hardhat'

async function main() {
    // Connect to Sepolia network
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL_SEPOLIA || 'https://rpc.sepolia.org')
    const [signer] = await ethers.getSigners()

    // Your deployed contract address
    const contractAddress = '0xBD830E10aD1A1cb6054da7A3B52BAFb93Bd0f4c1'

    console.log('🚀 Interacting with deployed StockLendOFTAdapter contract...')
    console.log('📍 Contract Address:', contractAddress)
    console.log('🔗 Network: Sepolia')
    console.log('👤 Deployer:', signer.address)

    try {
        // Try to get contract instance
        const contract = await ethers.getContractAt('StockLendOFTAdapter', contractAddress)

        // Get basic contract info
        console.log('\n📊 Contract Information:')

        // Check if it's a stock-related OFT adapter
        try {
            const stockSymbol = await contract.stockSymbol()
            const stockName = await contract.stockName()
            console.log('📈 Stock Symbol:', stockSymbol)
            console.log('🏢 Stock Name:', stockName)
        } catch (error) {
            console.log('ℹ️  This appears to be a standard OFT Adapter')
        }

        // Get owner
        const owner = await contract.owner()
        console.log('👑 Owner:', owner)

        // Get token address
        const tokenAddress = await contract.token()
        console.log('🪙 Token Address:', tokenAddress)

        // Get token info
        const tokenContract = await ethers.getContractAt('IERC20', tokenAddress)
        const tokenBalance = await tokenContract.balanceOf(contractAddress)
        console.log('💰 Contract Token Balance:', ethers.utils.formatEther(tokenBalance))

        // Check some collateral tracking (if available)
        try {
            const chainCollateral = await contract.getChainCollateral(1) // Check Ethereum mainnet
            console.log('🔗 Chain Collateral (Ethereum):', ethers.utils.formatEther(chainCollateral))
        } catch (error) {
            console.log('ℹ️  Standard OFT Adapter (no collateral tracking)')
        }

        console.log('\n✅ Contract is active and functioning!')
    } catch (error) {
        console.error('❌ Error interacting with contract:', error)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
