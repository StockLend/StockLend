import { type DeployFunction } from 'hardhat-deploy/types'

const deployStockLendProtocol: DeployFunction = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    // Use the deployed MyERC20Mock as USDC for demo
    const USDC_ADDRESS = '0x3990e910E03b8B79E9df9f4f0D5082dc5424B42A' // MyERC20Mock address

    await deploy('StockLendProtocol', {
        from: deployer,
        args: [
            USDC_ADDRESS, // USDC token address
            deployer, // Treasury address (deployer for now)
            deployer, // Owner address
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })
}

deployStockLendProtocol.tags = ['StockLendProtocol']

export default deployStockLendProtocol
