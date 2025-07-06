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
  sepolia: {
    chainId: "0xaa36a7",
    name: "Sepolia",
    symbol: "ETH",
    rpcUrl: "https://rpc.sepolia.org",
    blockExplorer: "https://sepolia.etherscan.io",
    usdcAddress: "0x6f14C02FC1F78322cFd7d707aB90f18baD3B54f5",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L13.09 8.26L19 7L13.09 15.74L12 22L10.91 15.74L5 7L10.91 8.26L12 2Z" fill="white" />
      </svg>
    ),
  },
  arbitrumSepolia: {
    chainId: "0x66eee",
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
    usdcAddress: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
        <path d="M8 12L12 8L16 12L12 16L8 12Z" fill="white" />
      </svg>
    ),
  },
  katana: {
    chainId: "0x1f977", // Hexadecimal representation - you may need to adjust this
    name: "Katana Testnet",
    symbol: "ETH",
    rpcUrl: "https://rpc.tatara.katanarpc.com/", // Please replace with actual RPC URL
    blockExplorer: "https://explorer.tatara.katana.network/", // Please replace with actual explorer URL
    usdcAddress: "0xe32FC2Ed67c47653f4D596C2fc7f993F49348cDB", // Please replace with actual USDC address
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="white" strokeWidth="2" fill="none" />
        <path d="M12 8L18 11.5V16.5L12 20L6 16.5V11.5L12 8Z" fill="white" />
      </svg>
    ),
  },
} 