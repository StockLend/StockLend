"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Calendar,
  PieChart,
  ArrowUpRight,
  Target
} from 'lucide-react'
import { 
  useStockLendContract,
  useStockLendRead,
  useTokenBalance,
  useTokenApproval,
  formatCurrency,
  formatPercentage
} from '@/lib/hooks/useContract'
import { parseUnits } from 'viem'
import toast from 'react-hot-toast'

interface MyPositionsComponentProps {
  onSuccess?: () => void
}

interface LoanPosition {
  loanId: number
  borrower: string
  stockToken: string
  stockSymbol: string
  collateralAmount: bigint
  loanAmount: bigint
  putStrike: bigint
  putPremium: bigint
  expiration: bigint
  targetYield: bigint
  protocolFee: bigint
  isActive: boolean
  putExercised: boolean
  creationPrice: bigint
  currentPrice: bigint
  repaymentAmount: bigint
  timeRemaining: string
  healthFactor: number
  status: 'healthy' | 'warning' | 'danger'
}

export default function MyPositionsComponent({ onSuccess }: MyPositionsComponentProps) {
  const { address, isConnected } = useAccount()
  
  // State
  const [positions, setPositions] = useState<LoanPosition[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [repayingLoanId, setRepayingLoanId] = useState<number | null>(null)
  
  // Contract hooks
  const { repayLoan } = useStockLendContract()
  const { userLoans, refetchUserLoans } = useStockLendRead()
  const { balance: usdcBalance, formattedBalance: usdcFormattedBalance } = useTokenBalance('USDC')
  const { 
    allowance: usdcAllowance, 
    approve: approveUSDC, 
    hasAllowance: hasUSDCAllowance 
  } = useTokenApproval('USDC')

  // Mock data for demonstration
  const mockPositions: LoanPosition[] = [
    {
      loanId: 1,
      borrower: address || '',
      stockToken: '0x1234...',
      stockSymbol: 'AAPL',
      collateralAmount: BigInt('100000000000000000000'), // 100 AAPL
      loanAmount: BigInt('15000000000'), // 15,000 USDC
      putStrike: BigInt('19000000000'), // $190 strike
      putPremium: BigInt('300000000'), // $300 premium
      expiration: BigInt(Date.now() / 1000 + 30 * 24 * 60 * 60), // 30 days
      targetYield: BigInt('468750000'), // Interest amount
      protocolFee: BigInt('93750000'), // Protocol fee
      isActive: true,
      putExercised: false,
      creationPrice: BigInt('20000000000'), // $200 creation price
      currentPrice: BigInt('18500000000'), // $185 current price
      repaymentAmount: BigInt('15562500000'), // Principal + interest
      timeRemaining: '29 days',
      healthFactor: 1.15, // Above 1.0 is healthy
      status: 'warning' // Price below creation
    },
    {
      loanId: 2,
      borrower: address || '',
      stockToken: '0x5678...',
      stockSymbol: 'TSLA',
      collateralAmount: BigInt('50000000000000000000'), // 50 TSLA
      loanAmount: BigInt('12000000000'), // 12,000 USDC
      putStrike: BigInt('24000000000'), // $240 strike
      putPremium: BigInt('240000000'), // $240 premium
      expiration: BigInt(Date.now() / 1000 + 15 * 24 * 60 * 60), // 15 days
      targetYield: BigInt('375000000'), // Interest
      protocolFee: BigInt('75000000'), // Protocol fee
      isActive: true,
      putExercised: false,
      creationPrice: BigInt('25000000000'), // $250 creation price
      currentPrice: BigInt('25500000000'), // $255 current price
      repaymentAmount: BigInt('12450000000'), // Principal + interest
      timeRemaining: '15 days',
      healthFactor: 1.38, // Healthy
      status: 'healthy'
    }
  ]

  // Load positions
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true)
      // For demo purposes, use mock data
      setTimeout(() => {
        setPositions(mockPositions.filter(pos => pos.borrower.toLowerCase() === address?.toLowerCase()))
        setIsLoading(false)
      }, 1000)
    }
  }, [isConnected, address])

  // Handle loan repayment
  const handleRepayLoan = async (loanId: number, repaymentAmount: bigint) => {
    setRepayingLoanId(loanId)
    
    try {
      // Check if approval is needed
      const needsApproval = !hasUSDCAllowance(repaymentAmount)
      
      if (needsApproval) {
        await approveUSDC((Number(repaymentAmount) / 1e6).toString(), 6)
        // Wait a bit for approval to process
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
      
      await repayLoan(loanId)
      
      // Update positions locally
      setPositions(prev => prev.filter(pos => pos.loanId !== loanId))
      
      toast.success('Loan repaid successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to repay loan:', error)
    } finally {
      setRepayingLoanId(null)
    }
  }

  // Format time remaining
  const formatTimeRemaining = (expiration: bigint): string => {
    const now = Math.floor(Date.now() / 1000)
    const expirationTime = Number(expiration)
    const timeLeft = expirationTime - now
    
    if (timeLeft <= 0) return 'Expired'
    
    const days = Math.floor(timeLeft / (24 * 60 * 60))
    const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60))
    
    if (days > 0) return `${days} days`
    return `${hours} hours`
  }

  // Calculate portfolio stats
  const portfolioStats = {
    totalBorrowed: positions.reduce((sum, pos) => sum + Number(pos.loanAmount), 0) / 1e6,
    totalCollateral: positions.reduce((sum, pos) => {
      const collateralValue = Number(pos.collateralAmount) / 1e18 * Number(pos.currentPrice) / 1e8
      return sum + collateralValue
    }, 0),
    totalRepayment: positions.reduce((sum, pos) => sum + Number(pos.repaymentAmount), 0) / 1e6,
    avgHealthFactor: positions.length > 0 
      ? positions.reduce((sum, pos) => sum + pos.healthFactor, 0) / positions.length 
      : 0,
    positionsAtRisk: positions.filter(pos => pos.status === 'warning' || pos.status === 'danger').length
  }

  if (!isConnected) {
    return (
      <Card className="p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <PieChart className="w-16 h-16 text-blue-400" />
          <h3 className="text-xl font-bold text-gray-700">Connect Wallet to View Positions</h3>
          <p className="text-gray-600">Connect your wallet to view and manage your active loans</p>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-600">Loading your positions...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <Card className="p-6" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
          }}>
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "700",
              fontSize: "28px",
              letterSpacing: "0.05em",
              color: "#2D3748",
            }}>
              MY_POSITIONS
            </h2>
            <p className="text-gray-600 mt-1">Manage your active loans and track performance</p>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            border: "1px solid rgba(99, 179, 237, 0.1)",
          }}>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total Borrowed</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(portfolioStats.totalBorrowed.toString())}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            border: "1px solid rgba(99, 179, 237, 0.1)",
          }}>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Collateral Value</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(portfolioStats.totalCollateral.toString())}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            border: "1px solid rgba(99, 179, 237, 0.1)",
          }}>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Total to Repay</p>
            <p className="text-lg font-bold text-orange-700">
              {formatCurrency(portfolioStats.totalRepayment.toString())}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            border: "1px solid rgba(99, 179, 237, 0.1)",
          }}>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Avg Health Factor</p>
            <p className={`text-lg font-bold ${
              portfolioStats.avgHealthFactor >= 1.2 ? 'text-green-700' :
              portfolioStats.avgHealthFactor >= 1.0 ? 'text-yellow-700' : 'text-red-700'
            }`}>
              {portfolioStats.avgHealthFactor.toFixed(2)}
            </p>
          </div>

          <div className="text-center p-4 rounded-lg" style={{
            backgroundColor: "rgba(99, 179, 237, 0.04)",
            border: "1px solid rgba(99, 179, 237, 0.1)",
          }}>
            <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">USDC Balance</p>
            <p className="text-lg font-bold text-blue-700">
              {formatCurrency(usdcFormattedBalance)}
            </p>
          </div>
        </div>
      </Card>

      {/* Positions List */}
      {positions.length === 0 ? (
        <Card className="p-8 text-center" style={{
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderColor: "rgba(99, 179, 237, 0.08)",
          backdropFilter: "blur(20px)",
        }}>
          <div className="flex flex-col items-center space-y-4">
            <Target className="w-16 h-16 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-700">No Active Positions</h3>
            <p className="text-gray-600">You don't have any active loans. Create a loan to start borrowing.</p>
          </div>
        </Card>
      ) : (
        positions.map((position) => (
          <Card key={position.loanId} className="p-6 transition-all duration-300 hover:shadow-lg" style={{
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            borderColor: position.status === 'danger' 
              ? "rgba(239, 68, 68, 0.3)" 
              : position.status === 'warning'
              ? "rgba(245, 158, 11, 0.3)"
              : "rgba(99, 179, 237, 0.08)",
            backdropFilter: "blur(20px)",
          }}>
            {/* Position Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold" style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    color: "#2D3748",
                  }}>
                    LOAN_#{position.loanId} - {position.stockSymbol}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    position.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    position.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {position.status.toUpperCase()}
                  </span>
                  {position.putExercised && (
                    <span className="px-2 py-1 text-xs font-bold bg-purple-100 text-purple-800 rounded-full">
                      PUT_EXERCISED
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mt-1">
                  Collateral: {(Number(position.collateralAmount) / 1e18).toFixed(2)} {position.stockSymbol}
                </p>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatTimeRemaining(position.expiration)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Health: {position.healthFactor.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Position Details */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                <TabsTrigger value="repayment">Repayment</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg" style={{
                    backgroundColor: "rgba(99, 179, 237, 0.04)",
                    border: "1px solid rgba(99, 179, 237, 0.1)",
                  }}>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Loan Amount</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatCurrency((Number(position.loanAmount) / 1e6).toString())}
                    </p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{
                    backgroundColor: "rgba(99, 179, 237, 0.04)",
                    border: "1px solid rgba(99, 179, 237, 0.1)",
                  }}>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Price</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatCurrency((Number(position.currentPrice) / 1e8).toString())}
                    </p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{
                    backgroundColor: "rgba(99, 179, 237, 0.04)",
                    border: "1px solid rgba(99, 179, 237, 0.1)",
                  }}>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Put Strike</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatCurrency((Number(position.putStrike) / 1e8).toString())}
                    </p>
                  </div>

                  <div className="text-center p-3 rounded-lg" style={{
                    backgroundColor: "rgba(99, 179, 237, 0.04)",
                    border: "1px solid rgba(99, 179, 237, 0.1)",
                  }}>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Interest</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatCurrency((Number(position.targetYield) / 1e6).toString())}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg" style={{
                    backgroundColor: position.status === 'healthy' 
                      ? "rgba(34, 197, 94, 0.04)" 
                      : position.status === 'warning'
                      ? "rgba(245, 158, 11, 0.04)"
                      : "rgba(239, 68, 68, 0.04)",
                    border: position.status === 'healthy'
                      ? "1px solid rgba(34, 197, 94, 0.1)"
                      : position.status === 'warning'
                      ? "1px solid rgba(245, 158, 11, 0.1)"
                      : "1px solid rgba(239, 68, 68, 0.1)",
                  }}>
                    <div className="flex items-center space-x-2 mb-2">
                      {position.status === 'healthy' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      )}
                      <span className="text-sm font-semibold">Position Health</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Health Factor: {position.healthFactor.toFixed(2)} {' '}
                      {position.healthFactor >= 1.2 ? '(Healthy)' :
                       position.healthFactor >= 1.0 ? '(Acceptable)' : '(At Risk)'}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg" style={{
                    backgroundColor: "rgba(99, 179, 237, 0.04)",
                    border: "1px solid rgba(99, 179, 237, 0.1)",
                  }}>
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold">Put Protection</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Strike: {formatCurrency((Number(position.putStrike) / 1e8).toString())} {' '}
                      {Number(position.currentPrice) < Number(position.putStrike) ? '(In the Money)' : '(Out of Money)'}
                    </p>
                  </div>
                </div>

                {position.status !== 'healthy' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {position.status === 'warning' 
                        ? `Warning: Stock price has declined. Monitor your position closely.`
                        : `Danger: Position at risk. Consider repaying loan or adding collateral.`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="repayment" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Repayment Breakdown</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Principal:</span>
                        <span className="font-semibold">
                          {formatCurrency((Number(position.loanAmount) / 1e6).toString())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest:</span>
                        <span className="font-semibold">
                          {formatCurrency((Number(position.targetYield) / 1e6).toString())}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Protocol Fee:</span>
                        <span className="font-semibold">
                          {formatCurrency((Number(position.protocolFee) / 1e6).toString())}
                        </span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-bold">
                        <span>Total Repayment:</span>
                        <span>
                          {formatCurrency((Number(position.repaymentAmount) / 1e6).toString())}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Your USDC Balance</h4>
                    <p className="text-2xl font-bold text-blue-700 mb-4">
                      {formatCurrency(usdcFormattedBalance)}
                    </p>
                    
                    <Button
                      onClick={() => handleRepayLoan(position.loanId, position.repaymentAmount)}
                      disabled={repayingLoanId === position.loanId || 
                               Number(usdcFormattedBalance) < Number(position.repaymentAmount) / 1e6}
                      className="w-full py-3 text-lg font-bold text-white"
                      style={{
                        fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                        fontWeight: "600",
                        letterSpacing: "0.05em",
                        background: Number(usdcFormattedBalance) >= Number(position.repaymentAmount) / 1e6
                          ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                          : "rgba(156, 163, 175, 0.5)",
                      }}
                    >
                      {repayingLoanId === position.loanId ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          REPAYING...
                        </>
                      ) : Number(usdcFormattedBalance) < Number(position.repaymentAmount) / 1e6 ? (
                        "INSUFFICIENT_BALANCE"
                      ) : (
                        <>
                          <ArrowUpRight className="w-4 h-4 mr-2" />
                          REPAY_LOAN
                        </>
                      )}
                    </Button>

                    {Number(usdcFormattedBalance) < Number(position.repaymentAmount) / 1e6 && (
                      <p className="text-xs text-red-600 mt-2 text-center">
                        Need {formatCurrency(((Number(position.repaymentAmount) / 1e6) - Number(usdcFormattedBalance)).toString())} more USDC
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        ))
      )}
    </div>
  )
} 