import type { ReactNode } from "react"

export interface Stock {
  symbol: string
  name: string
  price: number
}

export interface LoanDuration {
  value: string
  label: string
}

export interface Network {
  chainId: string
  name: string
  symbol: string
  rpcUrl: string
  blockExplorer: string
  usdcAddress: string
  icon: ReactNode
}

export type NetworkKey = "ethereum" | "polygon" | "arbitrum" | "base" | "mantle"

export interface PageProps {
  onNavigate: (page: string) => void
  isConnected: boolean
  account: string
  onDisconnect: () => void
  onConnect: () => void
  isConnecting: boolean
  currentNetwork: NetworkKey
  onSwitchNetwork: (networkKey: NetworkKey) => void
  isSwitchingNetwork: boolean
}

export interface AppPageProps extends PageProps {
  usdcBalance: number
} 