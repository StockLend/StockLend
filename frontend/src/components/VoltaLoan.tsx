"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, Zap, ArrowRight, TrendingUp, Shield, Clock, FileText, ChevronDown } from "lucide-react"
import { STOCKS, LOAN_DURATIONS, NETWORKS } from "@/lib/constants"
import type { NetworkKey } from "@/lib/types"

declare global {
  interface Window {
    ethereum?: any
  }
}

export default function VoltaLoan() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [account, setAccount] = useState("")
  const [currentPage, setCurrentPage] = useState("home")
  const [scrollY, setScrollY] = useState(0)
  const [usdcBalance, setUsdcBalance] = useState(0)
  const [currentNetwork, setCurrentNetwork] = useState<NetworkKey>("sepolia")
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  useEffect(() => {
    checkConnection()
    getCurrentNetwork()
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (isConnected && account) {
      fetchUSDCBalance()
    }
  }, [isConnected, account, currentNetwork])

  const getCurrentNetwork = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        const networkKey = Object.keys(NETWORKS).find(
          (key) => NETWORKS[key as NetworkKey].chainId === chainId,
        )
        if (networkKey) {
          setCurrentNetwork(networkKey as NetworkKey)
        }
      } catch (error) {
        console.error("Error getting current network:", error)
      }
    }
  }

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({ method: "eth_getAccounts" })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAccount(accounts[0])
        }
      } catch (error) {
        console.error("Error checking connection:", error)
      }
    }
  }

  const fetchUSDCBalance = async () => {
    if (!window.ethereum || !account) return

    try {
      const currentNetworkData = NETWORKS[currentNetwork]
      if (!currentNetworkData?.usdcAddress) {
        console.log("USDC not supported on this network")
        setUsdcBalance(0)
        return
      }

      // USDC has 6 decimals
      const balanceHex = await window.ethereum.request({
        method: "eth_call",
        params: [
          {
            to: currentNetworkData.usdcAddress,
            data: `0x70a08231000000000000000000000000${account.slice(2)}`, // balanceOf(address)
          },
          "latest",
        ],
      })

      const balanceWei = Number.parseInt(balanceHex, 16)
      const balance = balanceWei / 1000000 // USDC has 6 decimals
      setUsdcBalance(balance)
    } catch (error) {
      console.error("Error fetching USDC balance:", error)
      setUsdcBalance(0)
    }
  }

  const switchNetwork = async (networkKey: NetworkKey) => {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet!")
      return
    }

    setIsSwitchingNetwork(true)
    const network = NETWORKS[networkKey]

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      })

      setCurrentNetwork(networkKey)
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: network.symbol,
                  symbol: network.symbol,
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer],
              },
            ],
          })

          setCurrentNetwork(networkKey)
        } catch (addError) {
          console.error("Error adding network:", addError)
        }
      } else {
        console.error("Error switching network:", switchError)
      }
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("Please install a Web3 wallet!")
      return
    }

    setIsConnecting(true)

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      })

      if (accounts.length > 0) {
        setIsConnected(true)
        setAccount(accounts[0])
      }
    } catch (error) {
      console.error("Error connecting wallet:", error)
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setIsConnected(false)
    setAccount("")
    setUsdcBalance(0)
  }

  const navigateTo = (page: string) => {
    setCurrentPage(page)
  }

  if (currentPage === "app") {
    return (
      <AppPage
        onNavigate={navigateTo}
        isConnected={isConnected}
        account={account}
        onDisconnect={disconnectWallet}
        onConnect={connectWallet}
        isConnecting={isConnecting}
        usdcBalance={usdcBalance}
        currentNetwork={currentNetwork}
        onSwitchNetwork={switchNetwork}
        isSwitchingNetwork={isSwitchingNetwork}
      />
    )
  }

  if (currentPage === "docs") {
    return (
      <DocsPage
        onNavigate={navigateTo}
        isConnected={isConnected}
        account={account}
        onDisconnect={disconnectWallet}
        onConnect={connectWallet}
        isConnecting={isConnecting}
        currentNetwork={currentNetwork}
        onSwitchNetwork={switchNetwork}
        isSwitchingNetwork={isSwitchingNetwork}
      />
    )
  }

  const currentNetworkData = NETWORKS[currentNetwork]

  return (
    <div
      className="min-h-screen overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, #FEFCF8 0%, #F8FAFE 100%)",
        color: "#2D3748",
      }}
    >
      {/* Enhanced Animated Concentric Lines */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute border rounded-full"
            style={{
              width: `${150 + i * 120}px`,
              height: `${150 + i * 120}px`,
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.0008}) rotate(${scrollY * 0.15 + i * 30}deg)`,
              borderColor:
                i % 2 === 0 ? `rgba(99, 179, 237, ${0.08 - i * 0.005})` : `rgba(99, 179, 237, ${0.06 - i * 0.004})`,
              borderWidth: i < 4 ? "2px" : "1px",
              transition: "all 0.1s ease-out",
              boxShadow: i < 3 ? `0 0 20px rgba(99, 179, 237, ${0.05 - i * 0.01})` : "none",
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex justify-between items-center p-8">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
            >
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "700",
              fontSize: "26px",
              letterSpacing: "0.02em",
              background: "linear-gradient(135deg, #4299E1 0%, #63B3ED 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VOLTA_LOAN
          </div>
        </div>

        {!isConnected ? (
          <Button
            onClick={connectWallet}
            disabled={isConnecting}
            className="text-white font-semibold px-6 py-3"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
            }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {isConnecting ? "CONNECTING..." : "CONNECT_WALLET"}
          </Button>
        ) : (
          <div className="flex items-center space-x-3">
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
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
                  >
                    {currentNetworkData.icon}
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#4A5568" }}>
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
                    onClick={() => switchNetwork(key as NetworkKey)}
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
              className="font-semibold px-6 py-3 bg-transparent"
              style={{
                borderColor: "#63B3ED",
                color: "#4299E1",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            >
              {account.slice(0, 6)}...{account.slice(-4)}
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="max-w-5xl mx-auto">
          <h1
            className="text-6xl md:text-8xl font-bold mb-8 leading-tight"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "800",
              letterSpacing: "0.01em",
              color: "#4A5568",
              lineHeight: "0.9",
            }}
          >
            INSTITUTIONAL_GRADE
            <br />
            STOCK_LENDING
          </h1>

          <p
            className="text-2xl md:text-3xl mb-12 font-light"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "500",
              fontSize: "24px",
              letterSpacing: "0.02em",
              color: "#4A5568",
              lineHeight: "1.4",
            }}
          >
            CONNECT_TO_THE_MOST_TRUSTED_LENDING_NETWORK
            <br />
            FOR_TOKENIZED_EQUITIES
          </p>

          {/* Stats */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-2xl mx-auto">
            <div
              className="backdrop-blur-sm rounded-2xl p-8 border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderColor: "rgba(99, 179, 237, 0.1)",
              }}
            >
              <div
                className="text-sm mb-2 font-semibold tracking-wider uppercase"
                style={{
                  color: "#4299E1",
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  letterSpacing: "0.1em",
                }}
              >
                TOTAL_DEPOSITS
              </div>
              <div
                className="text-4xl font-bold"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "700",
                  fontSize: "32px",
                  letterSpacing: "0.02em",
                  color: "#2D3748",
                }}
              >
                $12,450,892
              </div>
            </div>
            <div
              className="backdrop-blur-sm rounded-2xl p-8 border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.3)",
                borderColor: "rgba(99, 179, 237, 0.1)",
              }}
            >
              <div
                className="text-sm mb-2 font-semibold tracking-wider uppercase"
                style={{
                  color: "#4299E1",
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  letterSpacing: "0.1em",
                }}
              >
                ACTIVE_LOANS
              </div>
              <div
                className="text-4xl font-bold"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "700",
                  fontSize: "32px",
                  letterSpacing: "0.02em",
                  color: "#2D3748",
                }}
              >
                $8,234,567
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              onClick={() => navigateTo("app")}
              size="lg"
              className="text-white px-12 py-6 text-xl font-bold rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "600",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                boxShadow: "0 10px 25px rgba(99, 179, 237, 0.3)",
              }}
            >
              LAUNCH_APP
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
            <Button
              onClick={() => navigateTo("docs")}
              size="lg"
              variant="outline"
              className="px-12 py-6 text-xl font-bold rounded-2xl transition-all duration-300 hover:scale-105"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "600",
                letterSpacing: "0.05em",
                borderColor: "#63B3ED",
                color: "#4299E1",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                borderWidth: "2px",
              }}
            >
              VIEW_DOCUMENTATION
            </Button>
          </div>
        </div>
      </section>

      {/* Bottom Section - Minimal Info */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div
              className="backdrop-blur-sm rounded-xl p-6 border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(99, 179, 237, 0.08)",
              }}
            >
              <Shield className="w-8 h-8 mx-auto mb-4" style={{ color: "#4299E1" }} />
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "600",
                  fontSize: "18px",
                  letterSpacing: "0.05em",
                  color: "#2D3748",
                }}
              >
                ZERO_LIQUIDATION_RISK
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "400",
                  fontSize: "14px",
                  color: "#4A5568",
                  lineHeight: "1.6",
                  letterSpacing: "0.02em",
                }}
              >
                PROTECTED_BY_EMBEDDED_DERIVATIVES
              </p>
            </div>
            <div
              className="backdrop-blur-sm rounded-xl p-6 border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(99, 179, 237, 0.08)",
              }}
            >
              <Clock className="w-8 h-8 mx-auto mb-4" style={{ color: "#4299E1" }} />
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "600",
                  fontSize: "18px",
                  letterSpacing: "0.05em",
                  color: "#2D3748",
                }}
              >
                FIXED_TERM_LOANS
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "400",
                  fontSize: "14px",
                  color: "#4A5568",
                  lineHeight: "1.6",
                  letterSpacing: "0.02em",
                }}
              >
                PREDICTABLE_TERMS_NO_MARGIN_CALLS
              </p>
            </div>
            <div
              className="backdrop-blur-sm rounded-xl p-6 border"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderColor: "rgba(99, 179, 237, 0.08)",
              }}
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-4" style={{ color: "#4299E1" }} />
              <h3
                className="text-xl font-bold mb-2"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "600",
                  fontSize: "18px",
                  letterSpacing: "0.05em",
                  color: "#2D3748",
                }}
              >
                STOCK_COLLATERAL
              </h3>
              <p
                className="text-sm"
                style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  fontWeight: "400",
                  fontSize: "14px",
                  color: "#4A5568",
                  lineHeight: "1.6",
                  letterSpacing: "0.02em",
                }}
              >
                TOKENIZED_EQUITIES_AS_COLLATERAL
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: "rgba(99, 179, 237, 0.2)" }}>
        <p
          className="text-sm"
          style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "400",
            fontSize: "14px",
            color: "#A0AEC0",
            letterSpacing: "0.05em",
          }}
        >
          VOLTA_LOAN_PROTOCOL - INSTITUTIONAL_GRADE_DEFI_LENDING_INFRASTRUCTURE
        </p>
      </footer>
    </div>
  )
}

// Import components from separate files
import AppPage from "./AppPage"
import DocsPage from "./DocsPage" 