import { ethers } from 'hardhat'
import { deployments } from 'hardhat'

async function main() {
    console.log('🎯 StockLend Protocol Demo')
    console.log('='.repeat(50))

    const [signer] = await ethers.getSigners()
    console.log('👤 Account:', signer.address)

    try {
        // Get deployed contracts
        console.log('\n📍 Getting deployed contracts...')

        const stockLendProtocolDeployment = await deployments.get('StockLendProtocol')
        const stockLendProtocol = await ethers.getContractAt('StockLendProtocol', stockLendProtocolDeployment.address)

        const stockTokenAAPLDeployment = await deployments.get('StockToken_AAPL')
        const stockTokenAAPL = await ethers.getContractAt('StockToken', stockTokenAAPLDeployment.address)

        const stockTokenTSLADeployment = await deployments.get('StockToken_TSLA')
        const stockTokenTSLA = await ethers.getContractAt('StockToken', stockTokenTSLADeployment.address)

        // Get USDC (using MyERC20Mock)
        const usdcAddress = await stockLendProtocol.USDC()
        const usdc = await ethers.getContractAt('IERC20', usdcAddress)

        console.log('✅ StockLend Protocol:', stockLendProtocol.address)
        console.log('✅ AAPL Token:', stockTokenAAPL.address)
        console.log('✅ TSLA Token:', stockTokenTSLA.address)
        console.log('✅ USDC Token:', usdcAddress)

        // Step 1: Check current balances
        console.log('\n💰 Current Balances:')
        const aaplBalance = await stockTokenAAPL.balanceOf(signer.address)
        const tslaBalance = await stockTokenTSLA.balanceOf(signer.address)
        const usdcBalance = await usdc.balanceOf(signer.address)

        console.log('- AAPL Balance:', ethers.utils.formatEther(aaplBalance))
        console.log('- TSLA Balance:', ethers.utils.formatEther(tslaBalance))
        console.log('- USDC Balance:', ethers.utils.formatEther(usdcBalance))

        // Step 2: Authorize minting (only if we're the owner)
        console.log('\n🔐 Setting up minting authorization...')

        try {
            // Check if we need to authorize minting
            const isAAPLMinter = await stockTokenAAPL.authorizedMinters(signer.address)
            const isTSLAMinter = await stockTokenTSLA.authorizedMinters(signer.address)

            if (!isAAPLMinter) {
                console.log('Authorizing AAPL minting...')
                await stockTokenAAPL.authorizeMinter(signer.address)
            }

            if (!isTSLAMinter) {
                console.log('Authorizing TSLA minting...')
                await stockTokenTSLA.authorizeMinter(signer.address)
            }

            console.log('✅ Minting authorization complete')

            // Step 3: Mint tokens if we don't have enough
            if (aaplBalance.lt(ethers.utils.parseEther('10'))) {
                console.log('🪙 Minting AAPL tokens...')
                await stockTokenAAPL.mint(signer.address, ethers.utils.parseEther('100'), 'Demo mint')
            }

            if (tslaBalance.lt(ethers.utils.parseEther('10'))) {
                console.log('🪙 Minting TSLA tokens...')
                await stockTokenTSLA.mint(signer.address, ethers.utils.parseEther('50'), 'Demo mint')
            }
        } catch (error) {
            console.log('⚠️  Could not mint tokens (not owner or already minted)')
        }

        // Step 4: Add stock assets to protocol
        console.log('\n🏭 Adding stock assets to protocol...')

        try {
            const aaplAsset = await stockLendProtocol.stockAssets(stockTokenAAPL.address)
            if (!aaplAsset.isActive) {
                console.log('Adding AAPL to protocol...')
                await stockLendProtocol.addStockAsset(
                    stockTokenAAPL.address,
                    '0x0000000000000000000000000000000000000000', // Mock price feed
                    7500 // 75% LTV
                )
            }

            const tslaAsset = await stockLendProtocol.stockAssets(stockTokenTSLA.address)
            if (!tslaAsset.isActive) {
                console.log('Adding TSLA to protocol...')
                await stockLendProtocol.addStockAsset(
                    stockTokenTSLA.address,
                    '0x0000000000000000000000000000000000000000', // Mock price feed
                    7000 // 70% LTV
                )
            }

            console.log('✅ Stock assets added to protocol')
        } catch (error) {
            console.log('⚠️  Could not add stock assets (not owner or already added)')
        }

        // Step 5: Show final balances
        console.log('\n📊 Final Status:')
        const finalAAPL = await stockTokenAAPL.balanceOf(signer.address)
        const finalTSLA = await stockTokenTSLA.balanceOf(signer.address)
        const finalUSDC = await usdc.balanceOf(signer.address)

        console.log('- AAPL Balance:', ethers.utils.formatEther(finalAAPL))
        console.log('- TSLA Balance:', ethers.utils.formatEther(finalTSLA))
        console.log('- USDC Balance:', ethers.utils.formatEther(finalUSDC))

        // Step 6: Show available actions
        console.log('\n🚀 Available Actions:')
        console.log('1. Create a loan with AAPL as collateral:')
        console.log(
            `   npx hardhat stock-lend:create-loan --stock ${stockTokenAAPL.address} --collateral 10000000000000000000 --loan 500000000000000000000 --duration 2592000 --network sepolia`
        )

        console.log('\n2. Create a loan with TSLA as collateral:')
        console.log(
            `   npx hardhat stock-lend:create-loan --stock ${stockTokenTSLA.address} --collateral 5000000000000000000 --loan 300000000000000000000 --duration 2592000 --network sepolia`
        )

        console.log('\n3. Check your loans:')
        console.log(`   # In a script or console: await stockLendProtocol.getUserLoans("${signer.address}")`)

        console.log('\n🎉 StockLend Protocol is ready to use!')
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
