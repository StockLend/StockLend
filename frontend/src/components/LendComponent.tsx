"use client"

import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, DollarSign, TrendingUp, Shield, CheckCircle } from 'lucide-react'
import { 
  useTokenBalance, 
  useTokenApproval, 
  useStockLendContract,
  useStockLendRead,
  formatCurrency,
  formatPercentage
} from '@/lib/hooks/useContract'
import { parseUnits } from 'viem'
import toast from 'react-hot-toast'

interface LendComponentProps {
  onSuccess?: () => void
}

export default function LendComponent({ onSuccess }: LendComponentProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  
  // Form state
  const [amount, setAmount] = useState('')
  const [isSupplying, setIsSupplying] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  
  // Contract hooks
  const { balance: usdcBalance, formattedBalance, decimals, refetch: refetchBalance } = useTokenBalance('USDC')
  const { 
    allowance, 
    approve, 
    hasAllowance, 
    isApproving, 
    refetchAllowance 
  } = useTokenApproval('USDC')
  const { supplyUSDC, isLoading: isContractLoading } = useStockLendContract()
  const { protocolStats, refetchProtocolStats } = useStockLendRead()

  // Form validation
  const amountNumber = Number(amount)
  const balanceNumber = Number(formattedBalance)
  const isValidAmount = amountNumber > 0 && amountNumber <= balanceNumber
  const needsApproval = amount && !hasAllowance(parseUnits(amount, 6))

  // Calculate yield preview
  const estimatedYield = amountNumber * 0.125 // 12.5% APY example

  // Handle max button
  const handleMaxClick = () => {
    setAmount(formattedBalance)
  }

  // Handle approval
  const handleApprove = async () => {
    if (!amount || !decimals) return
    
    try {
      await approve(amount, decimals)
      // Refetch allowance after approval
      setTimeout(() => {
        refetchAllowance()
      }, 2000)
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  // Handle supply
  const handleSupply = async () => {
    if (!amount || !isValidAmount) return

    setIsSupplying(true)
    
    try {
      // Appeler la fonction du contrat pour fournir des USDC
      await supplyUSDC(amount)
      
      // Réinitialiser le formulaire et rafraîchir les données
      setAmount('')
      setTimeout(() => {
        refetchBalance()
        refetchProtocolStats()
        onSuccess?.()
      }, 2000)
    } catch (error: any) {
      console.error('Supply failed:', error)
      toast.error(`Supply failed: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSupplying(false)
    }
  }

  // Auto-refetch data when connected
  useEffect(() => {
    if (isConnected) {
      refetchBalance()
      refetchProtocolStats()
    }
  }, [isConnected, chainId])

  // Add a debug function
  const debugConnection = async () => {
    console.log('=== DEBUG INFO ===')
    console.log('Connected Address:', address)
    console.log('Chain ID:', chainId)
    console.log('Public Client:', publicClient)
    
    if (address) {
      try {
        // Try to get native balance
        const balance = await publicClient.getBalance({ address })
        console.log('Native Balance:', balance)
      } catch (error) {
        console.error('Error getting native balance:', error)
      }
    }
    
    console.log('USDC Balance:', usdcBalance)
    console.log('USDC Formatted Balance:', formattedBalance)
    console.log('USDC Decimals:', decimals)
    console.log('Protocol Stats:', protocolStats)
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <DollarSign className="w-16 h-16 text-blue-400" />
          <h3 className="text-xl font-bold text-gray-700">Connect Wallet to Supply USDC</h3>
          <p className="text-gray-600">Connect your wallet to start earning yield by supplying USDC</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 transition-all duration-500 border hover:scale-105 hover:shadow-2xl" style={{
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      borderColor: "rgba(99, 179, 237, 0.08)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(99, 179, 237, 0.1)",
    }}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
          <DollarSign className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "32px",
            letterSpacing: "0.05em",
            color: "#2D3748",
          }}>
            SUPPLY_USDC
          </h2>
          <p className="text-gray-600 mt-1">Earn yield by supplying USDC to borrowers</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="rounded-lg p-4" style={{
          backgroundColor: "rgba(99, 179, 237, 0.04)",
          border: "1px solid rgba(99, 179, 237, 0.08)",
        }}>
          <h3 className="text-sm mb-1 font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "12px",
            color: "#4299E1",
            letterSpacing: "0.1em",
          }}>
            SUPPLY_APY
          </h3>
          <p className="text-2xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "24px",
            letterSpacing: "0.02em",
            color: "#4299E1",
          }}>
            12.5%
          </p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: "rgba(99, 179, 237, 0.04)",
          border: "1px solid rgba(99, 179, 237, 0.08)",
        }}>
          <h3 className="text-sm mb-1 font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "12px",
            color: "#4299E1",
            letterSpacing: "0.1em",
          }}>
            YOUR_BALANCE
          </h3>
          <p className="text-2xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "24px",
            letterSpacing: "0.02em",
            color: "#4299E1",
          }}>
            {formatCurrency(formattedBalance)}
          </p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: "rgba(99, 179, 237, 0.04)",
          border: "1px solid rgba(99, 179, 237, 0.08)",
        }}>
          <h3 className="text-sm mb-1 font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "12px",
            color: "#4299E1",
            letterSpacing: "0.1em",
          }}>
            TOTAL_SUPPLIED
          </h3>
          <p className="text-2xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "24px",
            letterSpacing: "0.02em",
            color: "#4299E1",
          }}>
            $2.4M
          </p>
        </div>

        <div className="rounded-lg p-4" style={{
          backgroundColor: "rgba(99, 179, 237, 0.04)",
          border: "1px solid rgba(99, 179, 237, 0.08)",
        }}>
          <h3 className="text-sm mb-1 font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "12px",
            color: "#4299E1",
            letterSpacing: "0.1em",
          }}>
            AVAILABLE
          </h3>
          <p className="text-2xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "24px",
            letterSpacing: "0.02em",
            color: "#4299E1",
          }}>
            $890K
          </p>
        </div>
      </div>

      {/* Supply Form */}
      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <Label className="font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "14px",
            color: "#4A5568",
            letterSpacing: "0.05em",
          }}>
            SUPPLY_AMOUNT
          </Label>
          <div className="flex mt-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 text-lg p-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "rgba(99, 179, 237, 0.3)",
                color: "#2D3748",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            />
            <Button
              onClick={handleMaxClick}
              className="ml-3 px-6 text-white"
              style={{
                background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                letterSpacing: "0.1em",
              }}
            >
              MAX
            </Button>
          </div>
        </div>

        {/* Yield Preview */}
        {amount && isValidAmount && (
          <div className="rounded-lg p-4" style={{
            backgroundColor: "rgba(72, 187, 120, 0.04)",
            border: "1px solid rgba(72, 187, 120, 0.1)",
          }}>
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">ESTIMATED_ANNUAL_YIELD</span>
            </div>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(estimatedYield.toString())}
            </p>
            <p className="text-xs text-green-600 mt-1">
              Based on current 12.5% APY
            </p>
          </div>
        )}

        {/* Error States */}
        {amount && !isValidAmount && (
          <Alert>
            <AlertDescription>
              {amountNumber <= 0 
                ? "Please enter a valid amount greater than 0"
                : "Insufficient USDC balance"
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {needsApproval && isValidAmount && (
            <Button
              onClick={handleApprove}
              disabled={isApproving}
              className="w-full py-4 text-lg font-bold"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "600",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)",
                color: "white",
              }}
            >
              {isApproving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  APPROVING...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  APPROVE_USDC
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleSupply}
            disabled={!isValidAmount || needsApproval || isSupplying}
            className="w-full py-4 text-lg font-bold text-white"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "600",
              letterSpacing: "0.05em",
              background: isValidAmount && !needsApproval 
                ? "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)"
                : "rgba(156, 163, 175, 0.5)",
            }}
          >
            {isSupplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                SUPPLYING...
              </>
            ) : needsApproval ? (
              "APPROVE_FIRST"
            ) : !isValidAmount ? (
              "ENTER_VALID_AMOUNT"
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                SUPPLY_USDC
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1" style={{
          fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
        }}>
          <p>Your USDC will be used to fund loans backed by tokenized stock collateral</p>
          <p>You can withdraw your supplied USDC + yield at any time</p>
        </div>
      </div>
      
      {/* Debug Button - Add this before the closing Card tag */}
      <div className="mt-4 text-center">
        <button 
          onClick={() => {
            debugConnection()
            setShowDebug(!showDebug)
          }}
          className="text-xs text-gray-500 underline"
        >
          {showDebug ? "Hide Debug Info" : "Show Debug Info"}
        </button>
        
        {showDebug && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-left text-xs">
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
            <p>Address: {address || "Not connected"}</p>
            <p>Chain ID: {chainId}</p>
            <p>USDC Balance: {formattedBalance}</p>
            <p>USDC Decimals: {decimals || "Unknown"}</p>
          </div>
        )}
      </div>
    </Card>
  )
} 