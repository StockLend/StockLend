"use client"

import { useState, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  TrendingUp, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Calculator,
  Info
} from 'lucide-react'
import { 
  useTokenBalance, 
  useTokenApproval, 
  useStockLendContract,
  useStockLendRead,
  useStockTokens,
  useLoanDurations,
  formatCurrency,
  formatPercentage
} from '@/lib/hooks/useContract'
import { parseUnits, parseEther } from 'viem'
import { getTokenAddress } from '@/lib/contracts'
import toast from 'react-hot-toast'

interface BorrowComponentProps {
  onSuccess?: () => void
}

interface LoanTerms {
  loanAmount: string
  interestRate: number
  duration: number
  putStrike: number
  putPremium: number
  totalRepayment: number
}

export default function BorrowComponent({ onSuccess }: BorrowComponentProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  
  // Form state
  const [selectedStock, setSelectedStock] = useState('')
  const [collateralAmount, setCollateralAmount] = useState('')
  const [loanAmount, setLoanAmount] = useState('')
  const [duration, setDuration] = useState('')
  const [isCalculating, setIsCalculating] = useState(false)
  const [loanTerms, setLoanTerms] = useState<LoanTerms | null>(null)
  
  // Contract hooks
  const stockTokens = useStockTokens()
  const loanDurations = useLoanDurations()
  const { 
    balance: stockBalance, 
    formattedBalance: stockFormattedBalance, 
    refetch: refetchStockBalance 
  } = useTokenBalance(selectedStock)
  const { 
    allowance: stockAllowance, 
    approve: approveStock, 
    hasAllowance: hasStockAllowance, 
    isApproving: isApprovingStock,
    refetchAllowance: refetchStockAllowance 
  } = useTokenApproval(selectedStock)
  const { createLoan, isLoading: isBorrowing } = useStockLendContract()
  const { previewLoan } = useStockLendRead()

  // Get stock token address
  const getStockTokenAddress = () => {
    if (!selectedStock) return undefined
    try {
      return getTokenAddress(chainId, selectedStock)
    } catch (error) {
      return undefined
    }
  }

  // Form validation
  const collateralNumber = Number(collateralAmount)
  const loanNumber = Number(loanAmount)
  const stockBalanceNumber = Number(stockFormattedBalance)
  const maxLTV = 0.75 // 75% max LTV
  const maxLoanAmount = collateralNumber * 200 * maxLTV // Assuming $200 stock price
  
  const isValidCollateral = collateralNumber > 0 && collateralNumber <= stockBalanceNumber
  const isValidLoan = loanNumber > 0 && loanNumber <= maxLoanAmount
  const isValidDuration = duration !== ''
  const isFormValid = isValidCollateral && isValidLoan && isValidDuration && selectedStock

  // Check if approval is needed
  const stockTokenAddress = getStockTokenAddress()
  const needsStockApproval = stockTokenAddress && collateralAmount && 
    !hasStockAllowance(parseEther(collateralAmount))

  // Calculate loan preview when inputs change
  useEffect(() => {
    const calculateLoanTerms = async () => {
      if (!isFormValid || !stockTokenAddress) return

      setIsCalculating(true)
      try {
        // Simulate loan calculation since we might not have deployed contracts
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const durationDays = Number(duration) / (24 * 60 * 60) // Convert seconds to days
        const annualRate = 0.125 // 12.5% APR
        const interest = loanNumber * annualRate * (durationDays / 365)
        const putPremiumValue = loanNumber * 0.02 // 2% put premium estimate
        
        setLoanTerms({
          loanAmount,
          interestRate: annualRate,
          duration: durationDays,
          putStrike: 200 * 0.95, // 5% below current price
          putPremium: putPremiumValue,
          totalRepayment: loanNumber + interest
        })
      } catch (error) {
        console.error('Error calculating loan terms:', error)
      } finally {
        setIsCalculating(false)
      }
    }

    const timeoutId = setTimeout(calculateLoanTerms, 500) // Debounce
    return () => clearTimeout(timeoutId)
  }, [loanAmount, collateralAmount, duration, selectedStock, isFormValid, stockTokenAddress])

  // Handle max collateral
  const handleMaxCollateral = () => {
    setCollateralAmount(stockFormattedBalance)
  }

  // Handle max loan based on collateral
  const handleMaxLoan = () => {
    if (collateralNumber > 0) {
      const maxLoan = (collateralNumber * 200 * maxLTV).toFixed(2)
      setLoanAmount(maxLoan)
    }
  }

  // Handle stock approval
  const handleApproveStock = async () => {
    if (!collateralAmount) return
    
    try {
      await approveStock(collateralAmount, 18) // Assuming 18 decimals for stock tokens
      setTimeout(() => {
        refetchStockAllowance()
      }, 2000)
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  // Handle borrow
  const handleBorrow = async () => {
    if (!isFormValid || !stockTokenAddress || needsStockApproval) return

    try {
      console.log(`Creating loan with:
        Stock Token: ${stockTokenAddress}
        Collateral Amount: ${collateralAmount}
        Loan Amount: ${loanAmount}
        Duration: ${duration}
      `)
      
      await createLoan(
        stockTokenAddress,
        collateralAmount,
        loanAmount,
        Number(duration)
      )
      
      // Reset form on success
      setTimeout(() => {
        setCollateralAmount('')
        setLoanAmount('')
        setDuration('')
        setLoanTerms(null)
        refetchStockBalance()
        onSuccess?.()
      }, 2000)
    } catch (error) {
      console.error('Borrow failed:', error)
    }
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <TrendingUp className="w-16 h-16 text-green-400" />
          <h3 className="text-xl font-bold text-gray-700">Connect Wallet to Borrow</h3>
          <p className="text-gray-600">Connect your wallet to start borrowing USDC against stock collateral</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 transition-all duration-500 border hover:scale-105 hover:shadow-2xl" style={{
      backgroundColor: "rgba(255, 255, 255, 0.25)",
      borderColor: "rgba(99, 179, 237, 0.08)",
      backdropFilter: "blur(20px)",
      boxShadow: "0 8px 32px rgba(72, 187, 120, 0.1)",
    }}>
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{
          background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)"
        }}>
          <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-4xl font-bold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "700",
            fontSize: "32px",
            letterSpacing: "0.05em",
            color: "#2D3748",
          }}>
            BORROW_USDC
          </h2>
          <p className="text-gray-600 mt-1">Borrow USDC using tokenized stock as collateral</p>
        </div>
      </div>

      {/* Borrow Form */}
      <div className="space-y-6">
        {/* Stock Selection */}
        <div>
          <Label className="font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "14px",
            color: "#4A5568",
            letterSpacing: "0.05em",
          }}>
            COLLATERAL_STOCK
          </Label>
          <Select value={selectedStock} onValueChange={setSelectedStock}>
            <SelectTrigger className="mt-2" style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderColor: "rgba(99, 179, 237, 0.3)",
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            }}>
              <SelectValue placeholder="SELECT_STOCK_TOKEN" />
            </SelectTrigger>
            <SelectContent>
              {stockTokens.map((stock) => (
                <SelectItem key={stock.symbol} value={stock.symbol}>
                  {stock.symbol} - {stock.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedStock && (
            <p className="text-xs text-gray-500 mt-1">
              Balance: {formatCurrency(stockFormattedBalance)} {selectedStock}
            </p>
          )}
        </div>

        {/* Collateral Amount */}
        <div>
          <Label className="font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "14px",
            color: "#4A5568",
            letterSpacing: "0.05em",
          }}>
            COLLATERAL_AMOUNT
          </Label>
          <div className="flex mt-2">
            <Input
              type="number"
              placeholder="0.0"
              value={collateralAmount}
              onChange={(e) => setCollateralAmount(e.target.value)}
              className="flex-1 text-lg p-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "rgba(99, 179, 237, 0.3)",
                color: "#2D3748",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            />
            <Button
              onClick={handleMaxCollateral}
              className="ml-3 px-6 text-white"
              disabled={!selectedStock}
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

        {/* Loan Amount */}
        <div>
          <Label className="font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "14px",
            color: "#4A5568",
            letterSpacing: "0.05em",
          }}>
            LOAN_AMOUNT_USDC
          </Label>
          <div className="flex mt-2">
            <Input
              type="number"
              placeholder="0.0"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              className="flex-1 text-lg p-4"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                borderColor: "rgba(99, 179, 237, 0.3)",
                color: "#2D3748",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              }}
            />
            <Button
              onClick={handleMaxLoan}
              className="ml-3 px-6 text-white"
              disabled={!collateralAmount}
              style={{
                background: "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)",
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                letterSpacing: "0.1em",
              }}
            >
              MAX
            </Button>
          </div>
          {collateralNumber > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Max loan: {formatCurrency((collateralNumber * 200 * maxLTV).toString())} (75% LTV)
            </p>
          )}
        </div>

        {/* Loan Duration */}
        <div>
          <Label className="font-semibold" style={{
            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            fontWeight: "500",
            fontSize: "14px",
            color: "#4A5568",
            letterSpacing: "0.05em",
          }}>
            LOAN_DURATION
          </Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger className="mt-2" style={{
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              borderColor: "rgba(99, 179, 237, 0.3)",
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
            }}>
              <SelectValue placeholder="SELECT_DURATION" />
            </SelectTrigger>
            <SelectContent>
              {loanDurations.map((duration) => (
                <SelectItem key={duration.value} value={duration.value.toString()}>
                  {duration.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loan Terms Preview */}
        {isCalculating && (
          <div className="rounded-lg p-4 border" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            borderColor: "rgba(99, 179, 237, 0.1)",
          }}>
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">CALCULATING_LOAN_TERMS...</span>
            </div>
          </div>
        )}

        {loanTerms && !isCalculating && (
          <div className="rounded-lg p-6 border" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            borderColor: "rgba(99, 179, 237, 0.1)",
          }}>
            <div className="flex items-center space-x-2 mb-4">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-700">LOAN_TERMS_PREVIEW</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Interest Rate</p>
                <p className="text-lg font-bold text-gray-700">{(loanTerms.interestRate * 100).toFixed(2)}% APR</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Put Strike Price</p>
                <p className="text-lg font-bold text-gray-700">{formatCurrency(loanTerms.putStrike.toString())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Put Premium</p>
                <p className="text-lg font-bold text-gray-700">{formatCurrency(loanTerms.putPremium.toString())}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Total Repayment</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(loanTerms.totalRepayment.toString())}</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-semibold">Put Option Protection Included</p>
                  <p>If {selectedStock} drops below {formatCurrency(loanTerms.putStrike.toString())}, 
                     you'll receive protection equal to the put premium paid.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error States */}
        {collateralAmount && !isValidCollateral && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {collateralNumber <= 0 
                ? "Please enter a valid collateral amount greater than 0"
                : `Insufficient ${selectedStock} balance`
              }
            </AlertDescription>
          </Alert>
        )}

        {loanAmount && !isValidLoan && isValidCollateral && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {loanNumber <= 0 
                ? "Please enter a valid loan amount greater than 0"
                : `Loan amount exceeds maximum LTV of 75%. Max: ${formatCurrency(maxLoanAmount.toString())}`
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {needsStockApproval && isFormValid && (
            <Button
              onClick={handleApproveStock}
              disabled={isApprovingStock}
              className="w-full py-4 text-lg font-bold"
              style={{
                fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                fontWeight: "600",
                letterSpacing: "0.05em",
                background: "linear-gradient(135deg, #F6AD55 0%, #ED8936 100%)",
                color: "white",
              }}
            >
              {isApprovingStock ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  APPROVING...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  APPROVE_{selectedStock}
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleBorrow}
            disabled={!isFormValid || needsStockApproval || isBorrowing || !loanTerms}
            className="w-full py-4 text-lg font-bold text-white"
            style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "600",
              letterSpacing: "0.05em",
              background: isFormValid && !needsStockApproval && loanTerms
                ? "linear-gradient(135deg, #63B3ED 0%, #4299E1 100%)"
                : "rgba(156, 163, 175, 0.5)",
            }}
          >
            {isBorrowing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                CREATING_LOAN...
              </>
            ) : needsStockApproval ? (
              "APPROVE_FIRST"
            ) : !isFormValid ? (
              "COMPLETE_FORM"
            ) : !loanTerms ? (
              "CALCULATING..."
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                CREATE_LOAN
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center space-y-1" style={{
          fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
        }}>
          <p>Your {selectedStock} tokens will be locked as collateral for the loan duration</p>
          <p>Put option protection is automatically included to hedge against price drops</p>
          <p>Repay your loan + interest to unlock your collateral</p>
        </div>
      </div>
    </Card>
  )
} 