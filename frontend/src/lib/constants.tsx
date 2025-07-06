import type { Stock, LoanDuration, Network, NetworkKey } from "./types"

export const STOCKS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", price: 185.25 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.5 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.3 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.65 },
]

export const LOAN_DURATIONS: LoanDuration[] = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "120", label: "120 days" },
  { value: "180", label: "180 days" },
  { value: "custom", label: "Custom" },
]

export const NETWORKS: Record<NetworkKey, Network> = {
  ethereum: {
    chainId: "0x1",
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    usdcAddress: "0xA0b86a33E6441b8435b662303c0f4c8c8e2D396e",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.09 8.26L19 7L13.09 15.74L12 22L10.91 15.74L5 7L10.91 8.26L12 2Z" fill="white" />
      </svg>
    ),
  },
  polygon: {
    chainId: "0x89",
    name: "Polygon",
    symbol: "MATIC",
    rpcUrl: "https://polygon-rpc.com/",
    blockExplorer: "https://polygonscan.com",
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  arbitrum: {
    chainId: "0xa4b1",
    name: "Arbitrum",
    symbol: "ETH",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    blockExplorer: "https://arbiscan.io",
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
        <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="white" />
      </svg>
    ),
  },
  base: {
    chainId: "0x2105",
    name: "Base",
    symbol: "ETH",
    rpcUrl: "https://mainnet.base.org",
    blockExplorer: "https://basescan.org",
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="4" fill="white" />
      </svg>
    ),
  },
  mantle: {
    chainId: "0x1388",
    name: "Mantle",
    symbol: "MNT",
    rpcUrl: "https://rpc.mantle.xyz",
    blockExplorer: "https://explorer.mantle.xyz",
    usdcAddress: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="white" strokeWidth="2" fill="none" />
        <path d="M12 8L18 11.5V16.5L12 20L6 16.5V11.5L12 8Z" fill="white" />
      </svg>
    ),
  },
} 