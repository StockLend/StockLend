import { EndpointId } from '@layerzerolabs/lz-definitions'
import { ExecutorOptionType } from '@layerzerolabs/lz-v2-utilities'
import { TwoWayConfig, generateConnectionsConfig } from '@layerzerolabs/metadata-tools'
import { OAppEnforcedOption } from '@layerzerolabs/toolbox-hardhat'

import type { OmniPointHardhat } from '@layerzerolabs/toolbox-hardhat'

/**
 * 🔁 Configuration LayerZero optimisée pour Katana
 *
 * Architecture mise à jour :
 * - Katana (chaîne principale) ↔ Ethereum (puts Opyn/Derive)
 * - Katana ↔ Arbitrum (vaults de yield)
 * - Katana ↔ Base (vaults de yield alternatifs)
 *
 * Katana utilise StockLendOFTAdapter pour les tokens de dette/collatéral
 * Les autres chaînes utilisent MyOFT pour les tokens natifs
 */

// Katana - Chaîne principale avec StockLendOFTAdapter
const katanaContract: OmniPointHardhat = {
    eid: EndpointId.KATANA_V2_TESTNET,
    contractName: 'StockLendOFTAdapter',
}

// Ethereum - Pour les puts via Opyn/Derive
const ethereumContract: OmniPointHardhat = {
    eid: EndpointId.ETHEREUM_V2_TESTNET,
    contractName: 'MyOFT',
}

// Arbitrum - Pour les vaults de yield
const arbitrumContract: OmniPointHardhat = {
    eid: EndpointId.ARBITRUM_V2_TESTNET,
    contractName: 'MyOFT',
}

// Base - Pour les vaults de yield alternatifs
const baseContract: OmniPointHardhat = {
    eid: EndpointId.BASE_V2_TESTNET,
    contractName: 'MyOFT',
}

// Sepolia - Testnet uniquement
const sepoliaContract: OmniPointHardhat = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: 'MyOFTAdapter',
}

// Options enforced optimisées pour les transactions cross-chain
const EVM_ENFORCED_OPTIONS: OAppEnforcedOption[] = [
    {
        msgType: 1,
        optionType: ExecutorOptionType.LZ_RECEIVE,
        gas: 100000, // Augmenté pour les transactions complexes
        value: 0,
    },
]

// Configuration des connexions directes - Hub-less architecture
const pathways: TwoWayConfig[] = [
    // Katana ↔ Ethereum (puts via Opyn/Derive)
    [
        katanaContract,
        ethereumContract,
        [['LayerZero Labs'], []],
        [1, 1], // Confirmations rapides
        [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS],
    ],
    // Katana ↔ Arbitrum (vaults de yield)
    [katanaContract, arbitrumContract, [['LayerZero Labs'], []], [1, 1], [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS]],
    // Katana ↔ Base (vaults de yield alternatifs)
    [katanaContract, baseContract, [['LayerZero Labs'], []], [1, 1], [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS]],
    // Sepolia ↔ Arbitrum (testnet seulement)
    [sepoliaContract, arbitrumContract, [['LayerZero Labs'], []], [1, 1], [EVM_ENFORCED_OPTIONS, EVM_ENFORCED_OPTIONS]],
]

export default async function () {
    // Generate the connections config based on the pathways
    const connections = await generateConnectionsConfig(pathways)
    return {
        contracts: [
            { contract: katanaContract }, // Chaîne principale
            { contract: ethereumContract }, // Puts
            { contract: arbitrumContract }, // Yield vaults
            { contract: baseContract }, // Yield vaults alternatifs
            { contract: sepoliaContract }, // Testnet
        ],
        connections,
    }
}
