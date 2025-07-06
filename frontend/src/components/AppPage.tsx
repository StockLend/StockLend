"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, Zap, TrendingUp, ChevronDown } from "lucide-react"
import { STOCKS, LOAN_DURATIONS, NETWORKS } from "@/lib/constants"
import type { AppPageProps } from "@/lib/types"

export default function AppPage({
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
}: AppPageProps) {
  const [supplyAmount, setSupplyAmount] = useState("")
  const [borrowAmount, setBorrowAmount] = useState("")
  const [selectedStock, setSelectedStock] = useState("AAPL")
  const [loanDuration, setLoanDuration] = useState("90")
  const [customDuration, setCustomDuration] = useState("")

  const currentNetworkData = NETWORKS[currentNetwork]

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
              className="w-32 h-0.5 rounded-full"
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