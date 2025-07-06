"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Wallet, Zap, FileText, ChevronDown } from "lucide-react"
import { NETWORKS } from "@/lib/constants"
import type { PageProps } from "@/lib/types"

export default function DocsPage({
  onNavigate,
  isConnected,
  account,
  onDisconnect,
  onConnect,
  isConnecting,
  currentNetwork,
  onSwitchNetwork,
  isSwitchingNetwork,
}: PageProps) {
  const currentNetworkData = NETWORKS[currentNetwork]

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