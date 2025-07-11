#!/bin/bash

# 🌉 StockLend Cross-Chain Demo Script
# Usage: ./demo-crosschain.sh [YOUR_ADDRESS]

set -e

echo "🌉 StockLend Protocol Cross-Chain Demo"
echo "======================================"

# Vérifier l'adresse
if [ -z "$1" ]; then
    echo "❌ Usage: ./demo-crosschain.sh [YOUR_ADDRESS]"
    echo "   Example: ./demo-crosschain.sh 0x1234567890123456789012345678901234567890"
    exit 1
fi

USER_ADDRESS=$1
echo "👤 Utilisateur: $USER_ADDRESS"

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "❌ Fichier .env non trouvé. Créez-le à partir de .env.example"
    exit 1
fi

echo ""
echo "🔧 Phase 1: Préparation"
echo "----------------------"

# Installation des dépendances
echo "📦 Installation des dépendances..."
npm install > /dev/null 2>&1

# Compilation
echo "⚙️  Compilation des contrats..."
npx hardhat compile > /dev/null 2>&1

echo ""
echo "🚀 Phase 2: Déploiement Multi-Chain"
echo "-----------------------------------"

# Déploiement sur Sepolia (chaîne principale)
echo "🌐 Déploiement sur Sepolia (chaîne principale)..."
npx hardhat lz:deploy --tags MyOFTAdapter --networks sepolia

# Déploiement sur chaînes secondaires
echo "🌐 Déploiement sur Arbitrum Sepolia..."
npx hardhat lz:deploy --tags MyOFT --networks arbitrum-testnet

echo "🌐 Déploiement sur Base Sepolia..."
npx hardhat lz:deploy --tags MyOFT --networks base-sepolia

echo ""
echo "🔗 Phase 3: Configuration LayerZero"
echo "-----------------------------------"

# Configuration des connexions
echo "⚡ Configuration des connexions cross-chain..."
npx hardhat lz:oapp:wire --oapp-config layerzero.config.ts

echo ""
echo "💰 Phase 4: Préparation des tokens"
echo "----------------------------------"

# Mint des tokens de test si nécessaire
echo "🪙 Mint de tokens de test..."
npx hardhat run scripts/mintMockUSDC.ts --network sepolia

echo ""
echo "🌉 Phase 5: Démonstration Cross-Chain"
echo "------------------------------------"

# Transfert 1: Sepolia → Arbitrum
echo "📤 Transfert Sepolia → Arbitrum (5 tokens)..."
TX1=$(npx hardhat lz:oft:send \
    --src-eid 40161 \
    --dst-eid 40231 \
    --amount 5 \
    --to $USER_ADDRESS \
    --network sepolia | grep "Explorer link" | cut -d' ' -f4-)

sleep 5

# Transfert 2: Sepolia → Base  
echo "📤 Transfert Sepolia → Base (3 tokens)..."
TX2=$(npx hardhat lz:oft:send \
    --src-eid 40161 \
    --dst-eid 40245 \
    --amount 3 \
    --to $USER_ADDRESS \
    --network sepolia | grep "Explorer link" | cut -d' ' -f4-)

echo ""
echo "✅ Demo Cross-Chain Complétée!"
echo "============================="

echo ""
echo "📊 Résumé des transferts:"
echo "• 5 tokens: Sepolia → Arbitrum"
echo "• 3 tokens: Sepolia → Base"

echo ""
echo "🔍 Liens de suivi:"
echo "• LayerZero Scan: https://testnet.layerzeroscan.com/"
echo "• Sepolia Explorer: https://sepolia.etherscan.io/"
echo "• Arbitrum Explorer: https://sepolia.arbiscan.io/"
echo "• Base Explorer: https://sepolia.basescan.org/"

echo ""
echo "📋 Vérification manuelle:"
echo "• Vérifiez vos balances sur chaque chaîne"
echo "• Consultez LayerZero Scan pour le statut des transactions"
echo "• Les tokens devraient apparaître sur les chaînes de destination"

echo ""
echo "🎉 Demo terminée avec succès!" 