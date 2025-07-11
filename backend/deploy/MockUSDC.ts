import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'
import { ethers } from 'hardhat'

const deployMockUSDC: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network } = hre
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    console.log(`\n📋 Deploying MockUSDC on ${network.name}`)
    console.log(`👤 Deployer: ${deployer}`)

    // Deploy MockUSDC
    const mockUSDC = await deploy('MockUSDC', {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.name === 'hardhat' ? 1 : 3,
    })

    console.log(`✅ MockUSDC deployed at: ${mockUSDC.address}`)

    // Get contract instance and mint initial tokens to deployer
    const MockUSDC = await ethers.getContractAt('MockUSDC', mockUSDC.address)

    // Mint 1,000,000 USDC to deployer for testing
    const mintAmount = ethers.utils.parseUnits('1000000', 6) // 1M USDC (6 decimals)
    console.log(`\n💰 Minting ${ethers.utils.formatUnits(mintAmount, 6)} USDC to deployer...`)

    const mintTx = await MockUSDC.mint(deployer, mintAmount)
    await mintTx.wait()

    const balance = await MockUSDC.balanceOf(deployer)
    console.log(`✅ Deployer USDC balance: ${ethers.utils.formatUnits(balance, 6)} USDC`)

    // Verification
    if (network.name !== 'hardhat' && network.name !== 'localhost') {
        console.log('\n🔍 Verifying contract...')
        try {
            await hre.run('verify:verify', {
                address: mockUSDC.address,
                constructorArguments: [],
            })
            console.log('✅ Contract verified successfully')
        } catch (error) {
            console.log('❌ Verification failed:', error)
        }
    }

    console.log(`\n📋 Summary:`)
    console.log(`MockUSDC Address: ${mockUSDC.address}`)
    console.log(`Network: ${network.name}`)
    console.log(`Deployer Balance: ${ethers.utils.formatUnits(balance, 6)} USDC`)
    console.log(`\n🚀 Ready to use! Update your frontend config with this address.`)

    return mockUSDC
}

export default deployMockUSDC
deployMockUSDC.tags = ['MockUSDC', 'mocks']
