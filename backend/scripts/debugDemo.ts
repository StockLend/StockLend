const { ethers } = require('hardhat')

async function main() {
    console.log('🔍 Debug Demo - Testing depositProtectionFund')

    const [deployer] = await ethers.getSigners()
    console.log('👤 Deployer:', deployer.address)

    try {
        // Deploy Mock USDC
        const MyERC20Mock = await ethers.getContractFactory('MyERC20Mock')
        const mockUSDC = await MyERC20Mock.deploy('USD Coin', 'USDC')
        await mockUSDC.deployed()
        console.log('✅ USDC deployed:', mockUSDC.address)

        // Deploy Protocol
        const StockLendProtocolV3 = await ethers.getContractFactory('StockLendProtocolV3')
        const protocolV3 = await StockLendProtocolV3.deploy(mockUSDC.address, deployer.address, deployer.address)
        await protocolV3.deployed()
        console.log('✅ Protocol deployed:', protocolV3.address)

        // Test minting
        const mintAmount = ethers.utils.parseEther('1000')
        await mockUSDC.mint(deployer.address, mintAmount)
        console.log('✅ Minted USDC')

        // Check balance
        const balance = await mockUSDC.balanceOf(deployer.address)
        console.log('📊 USDC Balance:', ethers.utils.formatEther(balance))

        // Test approval
        const approveAmount = ethers.utils.parseEther('100')
        await mockUSDC.approve(protocolV3.address, approveAmount)
        console.log('✅ Approved USDC')

        // Check allowance
        const allowance = await mockUSDC.allowance(deployer.address, protocolV3.address)
        console.log('📊 Allowance:', ethers.utils.formatEther(allowance))

        // Test small deposit first
        const smallAmount = ethers.utils.parseEther('10')
        console.log('🧪 Testing small deposit of 10 USDC...')
        await protocolV3.depositProtectionFund(smallAmount)
        console.log('✅ Small deposit successful!')

        // Check protocol stats
        const stats = await protocolV3.getProtocolStats()
        console.log('📊 Protection Fund:', ethers.utils.formatEther(stats.totalProtectionFund))
    } catch (error: any) {
        console.error('❌ Debug failed:', error.message)
        if (error.reason) console.error('💥 Reason:', error.reason)
        if (error.data) console.error('📄 Data:', error.data)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
