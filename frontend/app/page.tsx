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

declare global {
  interface Window {
    ethereum?: any
  }
}

const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", price: 185.25 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 248.5 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 875.3 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 378.85 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 142.65 },
]

const LOAN_DURATIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "120", label: "120 days" },
  { value: "180", label: "180 days" },
  { value: "custom", label: "Custom" },
]

// Network configurations
const NETWORKS = {
  ethereum: {
    chainId: "0x1",
    name: "Ethereum",
    symbol: "ETH",
    rpcUrl: "https://mainnet.infura.io/v3/",
    blockExplorer: "https://etherscan.io",
    usdcAddress: "0xA0b86a33E6441b8435b662303c0f4c8c8e2D396e", // USDC sur Ethereum
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
    usdcAddress: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", // USDC native sur Polygon (corrigé)
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
    usdcAddress: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // USDC sur Arbitrum
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
    usdcAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC sur Base
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
    usdcAddress: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9", // USDC sur Mantle
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2Z" stroke="white" strokeWidth="2" fill="none" />
        <path d="M12 8L18 11.5V16.5L12 20L6 16.5V11.5L12 8Z" fill="white" />
      </svg>
    ),
  },
}

export default function VoltaLoanHome() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [account, setAccount] = useState("")
  const [currentPage, setCurrentPage] = useState("home")
  const [scrollY, setScrollY] = useState(0)
  const [usdcBalance, setUsdcBalance] = useState(0)
  const [currentNetwork, setCurrentNetwork] = useState("ethereum")
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
          (key) => NETWORKS[key as keyof typeof NETWORKS].chainId === chainId,
        )
        if (networkKey) {
          setCurrentNetwork(networkKey)
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
      const currentNetworkData = NETWORKS[currentNetwork as keyof typeof NETWORKS]
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

  const switchNetwork = async (networkKey: string) => {
    if (!window.ethereum) {
      alert("Please install a Web3 wallet!")
      return
    }

    setIsSwitchingNetwork(true)
    const network = NETWORKS[networkKey as keyof typeof NETWORKS]

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
      alert("Please install Rabby wallet!")
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

  const currentNetworkData = NETWORKS[currentNetwork as keyof typeof NETWORKS]

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
            {/* Network Selector with Arrow */}
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
                    onClick={() => switchNetwork(key)}
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
            className="text-5xl md:text-6xl font-bold mb-8 leading-tight"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "800",
              letterSpacing: "0.01em",
              color: "#4A5568",
              lineHeight: "1.05",
            }}
          >
            INSTITUTIONAL_GRADE
            <br />
            STOCK_LENDING
          </h1>

          <p
  className="text-2xl md:text-3xl mb-12 font-light text-center"
  style={{
    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
    fontWeight: "500",
    fontSize: "24px",
    letterSpacing: "0.02em",
    color: "#4A5568",
    lineHeight: "1.5",
    display: "inline-block",
  }}
>
  CONNECT_TO_THE_MOST_TRUSTED_LENDING_NETWORK_FOR<br />
  TOKENIZED_STOCKS
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

// App Page Component
function AppPage({
  onNavigate,
  isConnected,
  account,
  onDisconnect,
  onConnect,
  isConnecting,
  usdcBalance,
  currentNetwork,
  onSwitchNetwork,
  isSwitchingNetwork,
}: any) {
  const [supplyAmount, setSupplyAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [selectedStock, setSelectedStock] = useState("AAPL")
  const [loanDuration, setLoanDuration] = useState("90")
  const [customDuration, setCustomDuration] = useState("")

  const currentNetworkData = NETWORKS[currentNetwork as keyof typeof NETWORKS]

  const handleMaxSupply = () => {
    setSupplyAmount(usdcBalance.toString())
  }

  const handleMaxBorrow = () => {
    const selectedStockData = STOCKS.find((s) => s.symbol === selectedStock)
    if (selectedStockData) {
      const maxBorrow = (selectedStockData.price * 0.75).toFixed(2) // 75% LTV
      setBorrowAmount(maxBorrow)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #FEFCF8 0%, #F8FAFE 100%)",
        color: "#2D3748",
      }}
    >
      <header className="flex justify-between items-center p-8">
        <button onClick={() => onNavigate("home")} className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
          >
            <Zap className="w-7 h-7 text-white" />
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
        </button>

        {isConnected ? (
          <div className="flex items-center space-x-3">
            {/* Network Selector with Arrow */}
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
                    onClick={() => onSwitchNetwork(key)}
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
              onClick={onDisconnect}
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
        ) : (
          <Button
            onClick={onConnect}
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
        )}
      </header>

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1
            className="text-5xl font-bold mb-4 text-center"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "800",
              fontSize: "48px",
              letterSpacing: "0.02em",
              color: "#2D3748",
            }}
          >
            TRADING_DASHBOARD
          </h1>

          {/* Decorative Line */}
          <div className="flex justify-center mb-12">
            <div
              className="h-0.5 rounded-full w-[200px]"
              style={{
                background: "linear-gradient(90deg, transparent, #63B3ED, #4299E1, transparent)",
              }}
            />
          </div>

          <Tabs defaultValue="trading" className="w-full">
            <TabsList
              className="grid w-full grid-cols-2 mb-8"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.6)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            >
              <TabsTrigger value="trading" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                TRADING
              </TabsTrigger>
              <TabsTrigger value="positions" style={{ color: "#4A5568", letterSpacing: "0.05em" }}>
                MY_POSITIONS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trading">
              <div className="grid md:grid-cols-2 gap-12">
                {/* USDC Lending Pool */}
                <Card
                  className="p-8 transition-all duration-500 border hover:scale-105 hover:shadow-2xl"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    borderColor: "rgba(99, 179, 237, 0.08)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(99, 179, 237, 0.1)",
                  }}
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <g fill="none" fillRule="evenodd">
                          <circle cx="16" cy="16" r="16" fill="#2775CA" />
                          <path
                            d="M15.75 27.5c-6.904 0-12.5-5.596-12.5-12.5S8.846 2.5 15.75 2.5 28.25 8.096 28.25 15s-5.596 12.5-12.5 12.5zm5.5-16.5c0-1.381-1.119-2.5-2.5-2.5h-6c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5h1v2h-1c-1.381 0-2.5 1.119-2.5 2.5s1.119 2.5 2.5 2.5h6c1.381 0 2.5-1.119 2.5-2.5s-1.119-2.5-2.5-2.5h-1v-2h1c1.381 0 2.5-1.119 2.5-2.5z"
                            fill="#FFF"
                          />
                        </g>
                      </svg>
                    </div>
                    <h2
                      className="text-4xl font-bold"
                      style={{
                        fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                        fontWeight: "700",
                        fontSize: "32px",
                        letterSpacing: "0.05em",
                        color: "#2D3748",
                      }}
                    >
                      SUPPLY_USDC
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        TOTAL_SUPPLIED
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        $2.4M
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        SUPPLY_APY
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        12.5%
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        AVAILABLE
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        $890K
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        YOUR_BALANCE
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        ${usdcBalance.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label
                        className="font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#4A5568",
                          letterSpacing: "0.05em",
                        }}
                      >
                        SUPPLY_AMOUNT
                      </Label>
                      <div className="flex mt-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={supplyAmount}
                          onChange={(e) => setSupplyAmount(e.target.value)}
                          className="flex-1 text-lg p-4"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            borderColor: "rgba(99, 179, 237, 0.3)",
                            color: "#2D3748",
                            fontFamily:
                              "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          }}
                        />
                        <Button
                          onClick={handleMaxSupply}
                          className="ml-3 px-6 text-white"
                          style={{
                            background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                            fontFamily:
                              "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            letterSpacing: "0.1em",
                          }}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    <Button
                      className="w-full py-4 text-lg font-bold text-white"
                      disabled={!isConnected}
                      style={{
                        fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                        fontWeight: "600",
                        letterSpacing: "0.05em",
                        background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                      }}
                    >
                      {isConnected ? "SUPPLY_USDC" : "CONNECT_WALLET_TO_SUPPLY"}
                    </Button>
                  </div>
                </Card>

                {/* Stock Collateral Borrowing */}
                <Card
                  className="p-8 transition-all duration-500 border hover:scale-105 hover:shadow-2xl"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    borderColor: "rgba(99, 179, 237, 0.08)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 8px 32px rgba(72, 187, 120, 0.1)",
                  }}
                >
                  <div className="flex items-center space-x-4 mb-8">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
                    >
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <h2
                      className="text-4xl font-bold"
                      style={{
                        fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                        fontWeight: "700",
                        fontSize: "32px",
                        letterSpacing: "0.05em",
                        color: "#2D3748",
                      }}
                    >
                      BORROW_USDC
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        TOTAL_BORROWED
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        $1.6M
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        BORROW_APR
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        8.2%
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        MAX_LTV
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        75%
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-4"
                      style={{
                        backgroundColor: "rgba(99, 179, 237, 0.04)",
                        border: "1px solid rgba(99, 179, 237, 0.08)",
                      }}
                    >
                      <h3
                        className="text-sm mb-1 font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "12px",
                          color: "#4299E1",
                          letterSpacing: "0.1em",
                        }}
                      >
                        YOUR_DEBT
                      </h3>
                      <p
                        className="text-2xl font-bold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "700",
                          fontSize: "24px",
                          letterSpacing: "0.02em",
                          color: "#4299E1",
                        }}
                      >
                        $0
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label
                        className="font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#4A5568",
                          letterSpacing: "0.05em",
                        }}
                      >
                        STOCK_COLLATERAL
                      </Label>
                      <Select value={selectedStock} onValueChange={setSelectedStock}>
                        <SelectTrigger
                          className="w-full mt-2 text-lg p-4"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            borderColor: "rgba(99, 179, 237, 0.3)",
                            color: "#2D3748",
                            fontFamily:
                              "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          }}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STOCKS.map((stock) => (
                            <SelectItem key={stock.symbol} value={stock.symbol}>
                              {stock.symbol} - {stock.name} (${stock.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        className="font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#4A5568",
                          letterSpacing: "0.05em",
                        }}
                      >
                        BORROW_AMOUNT_(USDC)
                      </Label>
                      <div className="flex mt-2">
                        <Input
                          type="number"
                          placeholder="0.0"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          className="flex-1 text-lg p-4"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            borderColor: "rgba(99, 179, 237, 0.3)",
                            color: "#2D3748",
                            fontFamily:
                              "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          }}
                        />
                        <Button
                          onClick={handleMaxBorrow}
                          className="ml-3 px-6 text-white"
                          style={{
                            background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                            fontFamily:
                              "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            letterSpacing: "0.1em",
                          }}
                        >
                          MAX
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label
                        className="font-semibold"
                        style={{
                          fontFamily:
                            "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                          fontWeight: "500",
                          fontSize: "14px",
                          color: "#4A5568",
                          letterSpacing: "0.05em",
                        }}
                      >
                        LOAN_DURATION
                      </Label>
                      <div className="space-y-3 mt-2">
                        <Select value={loanDuration} onValueChange={setLoanDuration}>
                          <SelectTrigger
                            className="w-full text-lg p-4"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              borderColor: "rgba(99, 179, 237, 0.3)",
                              color: "#2D3748",
                              fontFamily:
                                "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            }}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOAN_DURATIONS.map((duration) => (
                              <SelectItem key={duration.value} value={duration.value}>
                                {duration.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {loanDuration === "custom" && (
                          <Input
                            type="number"
                            placeholder="Enter custom days (1-365)"
                            value={customDuration}
                            onChange={(e) => setCustomDuration(e.target.value)}
                            min="1"
                            max="365"
                            className="text-lg p-4"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              borderColor: "rgba(99, 179, 237, 0.3)",
                              color: "#2D3748",
                              fontFamily:
                                "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full py-4 text-lg font-bold text-white"
                      disabled={!isConnected}
                      style={{
                        fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                        fontWeight: "600",
                        letterSpacing: "0.05em",
                        background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                      }}
                    >
                      {isConnected ? "BORROW_USDC" : "CONNECT_WALLET_TO_BORROW"}
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="positions">
              <div className="text-center py-20">
                <h2
                  className="text-3xl font-bold mb-4"
                  style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    fontWeight: "700",
                    fontSize: "32px",
                    letterSpacing: "0.05em",
                    color: "#2D3748",
                  }}
                >
                  MY_POSITIONS
                </h2>
                <p
                  style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    fontWeight: "400",
                    fontSize: "16px",
                    color: "#4A5568",
                    lineHeight: "1.6",
                    letterSpacing: "0.02em",
                  }}
                >
                  NO_ACTIVE_POSITIONS_YET._START_BY_SUPPLYING_OR_BORROWING_ASSETS.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Docs Page Component
function DocsPage({
  onNavigate,
  isConnected,
  account,
  onDisconnect,
  onConnect,
  isConnecting,
  currentNetwork,
  onSwitchNetwork,
  isSwitchingNetwork,
}: any) {
  const currentNetworkData = NETWORKS[currentNetwork as keyof typeof NETWORKS]

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #FEFCF8 0%, #F8FAFE 100%)",
        color: "#2D3748",
      }}
    >
      <header className="flex justify-between items-center p-8">
        <button onClick={() => onNavigate("home")} className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)" }}
          >
            <Zap className="w-7 h-7 text-white" />
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
        </button>

        {isConnected ? (
          <div className="flex items-center space-x-3">
            {/* Network Selector with Arrow */}
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
                    onClick={() => onSwitchNetwork(key)}
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
              onClick={onDisconnect}
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
        ) : (
          <Button
            onClick={onConnect}
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
        )}
      </header>

      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="max-w-2xl mx-auto">
          <FileText className="w-24 h-24 mx-auto mb-8" style={{ color: "#4299E1" }} />
          <h1
            className="text-6xl font-bold mb-8"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "800",
              fontSize: "48px",
              letterSpacing: "0.05em",
              color: "#2D3748",
            }}
          >
            DOCUMENTATION
          </h1>
          <div
            className="backdrop-blur-sm rounded-2xl p-12 border"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              borderColor: "rgba(99, 179, 237, 0.2)",
            }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "700",
                fontSize: "32px",
                letterSpacing: "0.05em",
                color: "#4299E1",
              }}
            >
              COMING_SOON!
            </h2>
            <p
              className="text-xl leading-relaxed"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "400",
                fontSize: "16px",
                color: "#4A5568",
                lineHeight: "1.8",
                letterSpacing: "0.02em",
              }}
            >
              OUR_COMPREHENSIVE_DOCUMENTATION_IS_CURRENTLY_BEING_PREPARED.
              <br />
              STAY_TUNED_FOR_DETAILED_GUIDES,_API_REFERENCES,_AND_TECHNICAL_SPECIFICATIONS.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
