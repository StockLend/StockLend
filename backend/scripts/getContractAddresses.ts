import * as fs from 'fs'
import * as path from 'path'

interface DeploymentInfo {
    address: string
    network: string
    contract: string
}

function getDeployedContracts(): DeploymentInfo[] {
    const deploymentsPath = path.join(__dirname, '../deployments')
    const contracts: DeploymentInfo[] = []

    try {
        const networks = fs.readdirSync(deploymentsPath)

        for (const network of networks) {
            const networkPath = path.join(deploymentsPath, network)
            if (fs.statSync(networkPath).isDirectory()) {
                const files = fs.readdirSync(networkPath)
                for (const file of files) {
                    if (file.endsWith('.json') && file !== '.chainId') {
                        const contractName = file.replace('.json', '')
                        const deploymentPath = path.join(networkPath, file)

                        try {
                            const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'))
                            contracts.push({
                                address: deployment.address,
                                network: network,
                                contract: contractName,
                            })
                        } catch (error) {
                            console.log(`⚠️  Failed to read ${file} on ${network}`)
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error reading deployments:', error)
    }

    return contracts
}

function printDeployedContracts() {
    const contracts = getDeployedContracts()

    console.log('\n🚀 **StockLend Deployed Contracts**\n')
    console.log('='.repeat(60))

    const groupedByNetwork = contracts.reduce(
        (acc, contract) => {
            if (!acc[contract.network]) {
                acc[contract.network] = []
            }
            acc[contract.network].push(contract)
            return acc
        },
        {} as Record<string, DeploymentInfo[]>
    )

    for (const [network, networkContracts] of Object.entries(groupedByNetwork)) {
        console.log(`\n🌐 **${network.toUpperCase()}**`)
        console.log('─'.repeat(50))

        for (const contract of networkContracts) {
            console.log(`📄 ${contract.contract}: ${contract.address}`)
        }
    }

    console.log('\n🔧 **LayerZero Integration:**')
    console.log('─'.repeat(50))
    const oftContracts = contracts.filter((c) => c.contract.includes('OFT'))

    if (oftContracts.length > 0) {
        console.log('Cross-chain OFT contracts:')
        for (const oft of oftContracts) {
            console.log(`  • ${oft.contract} (${oft.network}): ${oft.address}`)
        }
    } else {
        console.log('No OFT contracts found.')
    }

    console.log('\n📋 **Copy-paste for LayerZero config:**')
    console.log('─'.repeat(50))
    console.log('```typescript')
    console.log('const deployedContracts = {')
    for (const [network, networkContracts] of Object.entries(groupedByNetwork)) {
        console.log(`  ${network}: {`)
        for (const contract of networkContracts) {
            console.log(`    ${contract.contract}: '${contract.address}',`)
        }
        console.log('  },')
    }
    console.log('}')
    console.log('```')
}

// Export contract addresses as object
export function getContractAddresses(): Record<string, Record<string, string>> {
    const contracts = getDeployedContracts()
    const result: Record<string, Record<string, string>> = {}

    for (const contract of contracts) {
        if (!result[contract.network]) {
            result[contract.network] = {}
        }
        result[contract.network][contract.contract] = contract.address
    }

    return result
}

// Run if called directly
if (require.main === module) {
    printDeployedContracts()
}
