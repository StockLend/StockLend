import { type DeployFunction } from 'hardhat-deploy/types'

const deployStockToken: DeployFunction = async ({ getNamedAccounts, deployments }) => {
    const { deploy } = deployments
    const { deployer } = await getNamedAccounts()

    // Deploy Apple Stock Token
    await deploy('StockToken_AAPL', {
        contract: 'StockToken',
        from: deployer,
        args: [
            'Apple Stock Token', // name
            'sAAPL', // symbol
            'AAPL', // stockSymbol
            'Apple Inc.', // stockName
            deployer, // owner
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })

    // Deploy Tesla Stock Token
    await deploy('StockToken_TSLA', {
        contract: 'StockToken',
        from: deployer,
        args: [
            'Tesla Stock Token', // name
            'sTSLA', // symbol
            'TSLA', // stockSymbol
            'Tesla Inc.', // stockName
            deployer, // owner
        ],
        log: true,
        skipIfAlreadyDeployed: false,
    })
}

deployStockToken.tags = ['StockToken']

export default deployStockToken
