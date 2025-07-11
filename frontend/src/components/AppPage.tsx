"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, Zap, ChevronDown } from "lucide-react"
import { NETWORKS } from "@/lib/constants"
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi'
import { injected } from 'wagmi/connectors'
import type { AppPageProps } from "@/lib/types"
import LendComponent from "./LendComponent"
import BorrowComponent from "./BorrowComponent"
import PutOptionComponent from "./PutOptionComponent"
import MyPositionsComponent from "./MyPositionsComponent"
import DemoComponent from "./DemoComponent"
import { Toaster } from 'react-hot-toast'
import { useTokenApproval, useTokenBalance } from '@/lib/hooks/useContract'
import { getStockLendProtocolAddress } from '@/lib/contracts'
import { toast } from 'react-hot-toast'

export default function AppPage({
  onNavigate,
  currentNetwork,
  onSwitchNetwork,
  isSwitchingNetwork,
}: AppPageProps) {
  const { address, isConnected } = useAccount()
  const { connect, isPending: isConnecting } = useConnect()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()

  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showApprovalTools, setShowApprovalTools] = useState(false)

  // Hooks pour les approbations de tokens
  const {
    approve: approveUSDC,
    isApproving: isApprovingUSDC,
    refetchAllowance: refetchUSDCAllowance
  } = useTokenApproval('USDC')

  const {
    approve: approveAAPL,
    isApproving: isApprovingAAPL,
    refetchAllowance: refetchAAPLAllowance
  } = useTokenApproval('AAPL')

  // Hooks pour les balances de tokens
  const { formattedBalance: usdcBalance, refetch: refetchUSDCBalance } = useTokenBalance('USDC')
  const { formattedBalance: aaplBalance, refetch: refetchAAPLBalance } = useTokenBalance('AAPL')

  // Fonctions pour approuver les tokens
  const handleApproveUSDC = async () => {
    try {
      console.log('Approving USDC...')
      console.log('Chain ID:', chainId)
      console.log('Protocol address:', getStockLendProtocolAddress(chainId))

      await approveUSDC('1000000', 6) // 1,000,000 USDC (6 decimals)

      toast.success('USDC approval transaction sent!')
      setTimeout(() => refetchUSDCAllowance(), 2000)
    } catch (error) {
      console.error('Failed to approve USDC:', error)
      toast.error(`Failed to approve USDC: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleApproveAAPL = async () => {
    try {
      console.log('Approving AAPL...')
      console.log('Chain ID:', chainId)
      console.log('Protocol address:', getStockLendProtocolAddress(chainId))

      await approveAAPL('1000', 18) // 1,000 AAPL (18 decimals)

      toast.success('AAPL approval transaction sent!')
      setTimeout(() => refetchAAPLAllowance(), 2000)
    } catch (error) {
      console.error('Failed to approve AAPL:', error)
      toast.error(`Failed to approve AAPL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleSuccess = () => {
    // Trigger a refresh of all components
    setRefreshTrigger(prev => prev + 1)
  }

  const connectWallet = async () => {
    try {
      connect({ connector: injected() })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const disconnectWallet = () => {
    disconnect()
  }

  const currentNetworkData = NETWORKS[currentNetwork]

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #FEFCF8 0%, #F8FAFE 100%)",
        color: "#2D3748",
      }}
    >
      <Toaster position="top-right" />

      <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-4 sm:p-8 space-y-4 sm:space-y-0">
        <button onClick={() => onNavigate("home")} className="flex items-center space-x-3 mx-auto sm:mx-0">
          <div
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
          >
            <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div
            className="text-2xl sm:text-3xl font-bold"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "700",
              fontSize: "clamp(20px, 5vw, 26px)",
              letterSpacing: "0.02em",
              background: "linear-gradient(135deg, #4299E1 0%, #63B3ED 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VOLTA_LOAN
          </div>
        </button>

        {isConnected ? (
          <div className="flex items-center space-x-2 sm:space-x-3 justify-center sm:justify-end">
            {/* Network Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 backdrop-blur-sm rounded-full px-3 py-2 border bg-transparent"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
                    borderColor: "rgba(99, 179, 237, 0.3)",
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  }}
                  disabled={isSwitchingNetwork}
                >
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
                  >
                    {currentNetworkData.icon}
                  </div>
                  <span className="text-xs font-medium hidden sm:block" style={{ color: "#4A5568" }}>
                    {isSwitchingNetwork ? "..." : currentNetworkData.symbol}
                  </span>
                  <ChevronDown className="w-3 h-3" style={{ color: "#63B3ED" }} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(99, 179, 237, 0.2)",
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                }}
              >
                {Object.entries(NETWORKS).map(([key, network]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => onSwitchNetwork(key as any)}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-blue-50"
                    style={{ color: "#4A5568" }}
                  >
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
                    >
                      {network.icon}
                    </div>
                    <span className="font-medium">{network.name}</span>
                    {currentNetwork === key && <div className="w-2 h-2 rounded-full bg-green-500 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Wallet Address */}
            <Button
              onClick={disconnectWallet}
              variant="outline"
              className="font-semibold px-4 sm:px-6 py-2 sm:py-3 bg-transparent text-sm sm:text-base"
              style={{
                borderColor: "#63B3ED",
                color: "#4299E1",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            >
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </Button>
          </div>
        ) : (
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="text-white font-semibold px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base mx-auto sm:mx-0"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
            }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? "CONNECTING..." : "CONNECT_WALLET"}
          </Button>
        )}
      </header>

      <div className="p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "800",
              fontSize: "clamp(24px, 8vw, 48px)",
              letterSpacing: "0.02em",
              color: "#2D3748",
            }}
          >
            TRADING_DASHBOARD
          </h1>

          {/* Decorative Line */}
          <div className="flex justify-center mb-8 sm:mb-12">
            <div
              className="w-24 sm:w-32 h-0.5 rounded-full"
              style={{
                background: "linear-gradient(90deg, transparent, #63B3ED, #4299E1, transparent)",
              }}
            />
          </div>

          {/* Approval Tools Button */}
          {isConnected && (
            <div className="flex justify-center mb-4">
              <Button
                onClick={() => setShowApprovalTools(!showApprovalTools)}
                className="text-white font-semibold px-4 sm:px-6 py-2 text-xs sm:text-sm"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  background: "linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)",
                }}
              >
                {showApprovalTools ? "HIDE_TOKEN_APPROVALS" : "SHOW_TOKEN_APPROVALS"}
              </Button>
            </div>
          )}

          {/* Token Approval Tools */}
          {isConnected && showApprovalTools && (
            <div className="mb-6 sm:mb-8 p-4 rounded-lg" style={{
              backgroundColor: "rgba(255, 255, 255, 0.5)",
              borderColor: "rgba(99, 179, 237, 0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(99, 179, 237, 0.2)",
            }}>
              <h3 className="text-base sm:text-lg font-bold mb-4 text-center" style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}>TOKEN_APPROVAL_TOOLS</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg" style={{
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(99, 179, 237, 0.2)",
                }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-sm sm:text-base">USDC Balance:</span>
                    <span className="text-sm sm:text-base">{usdcBalance} USDC</span>
                  </div>
                  <Button
                    onClick={handleApproveUSDC}
                    disabled={isApprovingUSDC}
                    className="w-full text-sm sm:text-base"
                    style={{
                      background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                      color: "white",
                    }}
                  >
                    {isApprovingUSDC ? "APPROVING..." : "APPROVE_USDC"}
                  </Button>
                </div>

                <div className="p-4 rounded-lg" style={{
                  backgroundColor: "rgba(255, 255, 255, 0.7)",
                  border: "1px solid rgba(99, 179, 237, 0.2)",
                }}>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-1 sm:space-y-0">
                    <span className="font-semibold text-sm sm:text-base">AAPL Balance:</span>
                    <span className="text-sm sm:text-base">{aaplBalance} AAPL</span>
                  </div>
                  <Button
                    onClick={handleApproveAAPL}
                    disabled={isApprovingAAPL}
                    className="w-full text-sm sm:text-base"
                    style={{
                      background: "linear-gradient(135deg, #68D391 0%, #48BB78 100%)",
                      color: "white",
                    }}
                  >
                    {isApprovingAAPL ? "APPROVING..." : "APPROVE_AAPL"}
                  </Button>
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="mt-4 p-4 rounded-lg" style={{
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                border: "1px solid rgba(99, 179, 237, 0.2)",
              }}>
                <Button
                  onClick={() => {
                    try {
                      const protocolAddress = getStockLendProtocolAddress(chainId)
                      console.log('Protocol address:', protocolAddress)
                      toast.success(`Successfully connected to protocol at ${protocolAddress}`)

                      // Refresh balances
                      refetchUSDCBalance()
                      refetchAAPLBalance()
                      refetchUSDCAllowance()
                      refetchAAPLAllowance()
                    } catch (error) {
                      console.error('Connection test failed:', error)
                      toast.error(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                    }
                  }}
                  className="w-full text-sm sm:text-base"
                  style={{
                    background: "linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)",
                    color: "white",
                  }}
                >
                  TEST_CONNECTION
                </Button>
              </div>

              <div className="mt-2 text-xs text-gray-500 text-center">
                <p className="break-all">Protocol Address: {chainId ? getStockLendProtocolAddress(chainId) : "Not connected"}</p>
                <p className="mt-1">Network: {chainId || "Unknown"}</p>
              </div>
            </div>
          )}

          <Tabs defaultValue="lend" className="w-full">
            <TabsList
              className="grid w-full grid-cols-2 sm:grid-cols-5 mb-6 sm:mb-8"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            >
              <TabsTrigger value="lend" className="text-xs sm:text-sm" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                LEND_USDC
              </TabsTrigger>
              <TabsTrigger value="borrow" className="text-xs sm:text-sm" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                BORROW_USDC
              </TabsTrigger>
              <TabsTrigger value="hedge" className="text-xs sm:text-sm" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                PUT_OPTIONS
              </TabsTrigger>
              <TabsTrigger value="positions" className="text-xs sm:text-sm" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                MY_POSITIONS
              </TabsTrigger>
              <TabsTrigger value="demo" className="text-xs sm:text-sm" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                ALICE_DEMO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lend">
              <LendComponent onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="borrow">
              <BorrowComponent onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="hedge">
              <PutOptionComponent onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="positions">
              <MyPositionsComponent onSuccess={handleSuccess} />
            </TabsContent>

            <TabsContent value="demo">
              <DemoComponent />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
} 