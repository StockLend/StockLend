import { http, createConfig } from 'wagmi'
import { sepolia, arbitrumSepolia } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

// Custom Katana testnet chain configuration
export const katanaTestnet = {
  id: 129399, // Mise à jour du chainId pour Katara testnet
  name: 'Katana Testnet (Katara)',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.tatara.katanarpc.com/'],
    },
    public: {
      http: ['https://rpc.tatara.katanarpc.com/'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.tatara.katana.network/' },
  },
} as const

export const config = createConfig({
  chains: [sepolia, arbitrumSepolia, katanaTestnet],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({
      appName: 'Volta Loan',
    }),
    // Temporarily removing WalletConnect due to indexedDB issues
    // walletConnect({
    //   projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '1234567890',
    // }),
  ],
  transports: {
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
    [katanaTestnet.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
} 