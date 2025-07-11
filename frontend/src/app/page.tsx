"use client"

import { useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import Web3Provider from "@/components/Web3Provider"
import AppPage from "@/components/AppPage"
import type { NetworkKey } from "@/lib/types"

function AppWrapper() {
  const { address, isConnected } = useAccount()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()

  const [currentNetwork, setCurrentNetwork] = useState<NetworkKey>("sepolia")
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  const handleConnect = async () => {
    try {
      connect({ connector: injected() })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleSwitchNetwork = async (network: NetworkKey) => {
    setIsSwitchingNetwork(true)
    setCurrentNetwork(network)
    setTimeout(() => setIsSwitchingNetwork(false), 1000)
  }

  const handleNavigate = (page: string) => {
    console.log(`Navigating to ${page}`)
  }

  return (
    <AppPage
      onNavigate={handleNavigate}
      isConnected={isConnected}
      account={address || ''}
      onDisconnect={handleDisconnect}
      onConnect={handleConnect}
      isConnecting={isConnecting}
      currentNetwork={currentNetwork}
      onSwitchNetwork={handleSwitchNetwork}
      isSwitchingNetwork={isSwitchingNetwork}
      usdcBalance={0} // This will be fetched from hooks
    />
  )
}

export default function Home() {
  return (
    <Web3Provider>
      <AppWrapper />
    </Web3Provider>
  )
}
