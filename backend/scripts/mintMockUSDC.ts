import { ethers } from 'hardhat'
import { parseArgs } from 'util'

async function main() {
    // Parse command line arguments
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: {
            address: { type: 'string', short: 'a' },
            amount: { type: 'string', short: 'm' },
            contract: { type: 'string', short: 'c' },
        },
    })

    const targetAddress = values.address
    const amount = values.amount || '10000' // Default 10,000 USDC
    const contractAddress = values.contract

    if (!targetAddress) {
        console.error('❌ Error: Please provide a target address using --address or -a')
        console.log(
            'Usage: npx hardhat run scripts/mintMockUSDC.ts --network sepolia -- --address 0x... --amount 10000'
        )
        process.exit(1)
    }

    if (!contractAddress) {
        console.error('❌ Error: Please provide the MockUSDC contract address using --contract or -c')
        console.log(
            'Usage: npx hardhat run scripts/mintMockUSDC.ts --network sepolia -- --address 0x... --contract 0x... --amount 10000'
        )
        process.exit(1)
    }

    console.log(`\n💰 Minting MockUSDC tokens...`)
    console.log(`📍 Contract: ${contractAddress}`)
    console.log(`👤 Target Address: ${targetAddress}`)
    console.log(`💵 Amount: ${amount} USDC`)

    try {
        // Get contract instance
        const MockUSDC = await ethers.getContractAt('MockUSDC', contractAddress)

        // Check if contract exists
        const name = await MockUSDC.name()
        const symbol = await MockUSDC.symbol()
        const decimals = await MockUSDC.decimals()

        console.log(`\n📋 Contract Info:`)
        console.log(`Name: ${name}`)
        console.log(`Symbol: ${symbol}`)
        console.log(`Decimals: ${decimals}`)

        // Check current balance
        const currentBalance = await MockUSDC.balanceOf(targetAddress)
        console.log(`\n💳 Current balance: ${ethers.utils.formatUnits(currentBalance, 6)} USDC`)

        // Mint tokens
        const mintAmount = ethers.utils.parseUnits(amount, 6)
        console.log(`\n🔄 Minting ${amount} USDC...`)

        const tx = await MockUSDC.mint(targetAddress, mintAmount)
        console.log(`📝 Transaction hash: ${tx.hash}`)

        console.log(`⏳ Waiting for confirmation...`)
        await tx.wait()

        // Check new balance
        const newBalance = await MockUSDC.balanceOf(targetAddress)
        console.log(`✅ Minting successful!`)
        console.log(`💳 New balance: ${ethers.utils.formatUnits(newBalance, 6)} USDC`)
        console.log(`📈 Added: ${ethers.utils.formatUnits(newBalance.sub(currentBalance), 6)} USDC`)
    } catch (error) {
        console.error('❌ Error minting tokens:', error)
        process.exit(1)
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
