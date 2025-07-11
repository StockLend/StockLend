"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  TrendingDown,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Zap,
  Download,
  Trophy
} from 'lucide-react'
import {
  useStockLendContract,
  useStockLendRead,
  formatCurrency,
  formatPercentage
} from '@/lib/hooks/useContract'
import toast from 'react-hot-toast'

interface PutOptionComponentProps {
  onSuccess?: () => void
}

interface LoanWithPutOption {
  loanId: number
  borrower: string
  stockToken: string
  stockSymbol: string
  collateralAmount: bigint
  loanAmount: bigint
  putStrike: bigint
  putPremium: bigint
  expiration: bigint
  isActive: boolean
  putExercised: boolean
  currentPrice: bigint
  intrinsicValue: bigint
  shouldExercise: boolean
  timeRemaining: string
  profitLoss: number
  claimableRewards: bigint
  rewardsClaimed: boolean
}

export default function PutOptionComponent({ onSuccess }: PutOptionComponentProps) {
  const { address, isConnected } = useAccount()

  // State
  const [loans, setLoans] = useState<LoanWithPutOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [exercisingLoanId, setExercisingLoanId] = useState<number | null>(null)
  const [claimingLoanId, setClaimingLoanId] = useState<number | null>(null)

  // Contract hooks
  const { exercisePutOption } = useStockLendContract()
  const { userLoans, refetchUserLoans } = useStockLendRead()

  // Mock data for demonstration (since contracts might not be deployed)
  const mockLoans: LoanWithPutOption[] = [
    {
      loanId: 1,
      borrower: address || '',
      stockToken: '0x1234...',
      stockSymbol: 'AAPL',
      collateralAmount: BigInt('100000000000000000000'), // 100 AAPL
      loanAmount: BigInt('15000000000'), // 15,000 USDC (6 decimals)
      putStrike: BigInt('19000000000'), // $190 strike (8 decimals)
      putPremium: BigInt('300000000'), // $300 premium (6 decimals)
      expiration: BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60), // 30 days from now
      isActive: true,
      putExercised: false,
      currentPrice: BigInt('18500000000'), // $185 current price (8 decimals)
      intrinsicValue: BigInt('500000000'), // $5 intrinsic value per share
      shouldExercise: true,
      timeRemaining: '29 days',
      profitLoss: 2.5, // 2.5% profit if exercised
      claimableRewards: BigInt('0'), // No rewards yet
      rewardsClaimed: false
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
      expiration: BigInt(Math.floor(Date.now() / 1000) + 15 * 24 * 60 * 60), // 15 days from now
      isActive: true,
      putExercised: true, // Already exercised
      currentPrice: BigInt('25500000000'), // $255 current price
      intrinsicValue: BigInt('0'), // No intrinsic value (out of the money)
      shouldExercise: false,
      timeRemaining: '15 days',
      profitLoss: -1.2, // 1.2% loss (premium paid but option worthless)
      claimableRewards: BigInt('1200000000'), // $1,200 USDC rewards to claim
      rewardsClaimed: false
    }
  ]

  // Load loan data
  useEffect(() => {
    if (isConnected) {
      setIsLoading(true)
      // For demo purposes, use mock data
      setTimeout(() => {
        setLoans(mockLoans.filter(loan => loan.borrower.toLowerCase() === address?.toLowerCase()))
        setIsLoading(false)
      }, 1000)
    }
  }, [isConnected, address])

  // Handle put option exercise
  const handleExercise = async (loanId: number) => {
    setExercisingLoanId(loanId)

    try {
      await exercisePutOption(loanId)

      // Update loan state locally - simulate earning rewards
      setLoans(prev => prev.map(loan =>
        loan.loanId === loanId
          ? {
            ...loan,
            putExercised: true,
            claimableRewards: BigInt('1500000000') // $1,500 USDC rewards earned
          }
          : loan
      ))

      toast.success('Put option exercised successfully! 🎉')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to exercise put option:', error)
      toast.error('Failed to exercise put option')
    } finally {
      setExercisingLoanId(null)
    }
  }

  // Handle rewards claim
  const handleClaimRewards = async (loanId: number) => {
    setClaimingLoanId(loanId)

    try {
      // Simulate claiming rewards (replace with actual contract call)
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Update loan state locally
      setLoans(prev => prev.map(loan =>
        loan.loanId === loanId
          ? { ...loan, rewardsClaimed: true, claimableRewards: BigInt('0') }
          : loan
      ))

      toast.success('USDC rewards claimed successfully! 💰')
      onSuccess?.()
    } catch (error) {
      console.error('Failed to claim rewards:', error)
      toast.error('Failed to claim rewards')
    } finally {
      setClaimingLoanId(null)
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

  // Calculate total claimable rewards
  const totalClaimableRewards = loans.reduce((sum, loan) =>
    sum + Number(loan.claimableRewards), 0
  ) / 1e6

  if (!isConnected) {
    return (
      <Card className="p-6 sm:p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <Shield className="w-12 h-12 sm:w-16 sm:h-16 text-purple-400" />
          <h3 className="text-lg sm:text-xl font-bold text-gray-700">Connect Wallet for Put Options</h3>
          <p className="text-sm sm:text-base text-gray-600">Connect your wallet to view and exercise put options on your loans</p>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="p-6 sm:p-8 text-center" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-400" />
          <p className="text-sm sm:text-base text-gray-600">Loading your put options...</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="p-4 sm:p-6" style={{
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        borderColor: "rgba(99, 179, 237, 0.08)",
        backdropFilter: "blur(20px)",
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto sm:mx-0" style={{
            background: "linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)"
          }}>
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{
              fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
              fontWeight: "700",
              letterSpacing: "0.05em",
              color: "#2D3748",
            }}>
              PUT_OPTION_HEDGING
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Exercise put options to hedge against stock price drops</p>
          </div>
        </div>

        {/* Rewards Summary */}
        {totalClaimableRewards > 0 && (
          <div className="mt-4 p-3 sm:p-4 rounded-lg" style={{
            backgroundColor: "rgba(34, 197, 94, 0.04)",
            border: "1px solid rgba(34, 197, 94, 0.1)",
          }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span className="text-sm sm:text-base font-semibold text-green-700">
                  Total Claimable Rewards
                </span>
              </div>
              <span className="text-lg sm:text-xl font-bold text-green-700">
                {formatCurrency(totalClaimableRewards.toString())}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Put Options List */}
      {loans.length === 0 ? (
        <Card className="p-6 sm:p-8 text-center" style={{
          backgroundColor: "rgba(255, 255, 255, 0.25)",
          borderColor: "rgba(99, 179, 237, 0.08)",
          backdropFilter: "blur(20px)",
        }}>
          <div className="flex flex-col items-center space-y-4">
            <TrendingDown className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
            <h3 className="text-lg sm:text-xl font-bold text-gray-700">No Active Put Options</h3>
            <p className="text-sm sm:text-base text-gray-600">You don't have any active loans with put option protection</p>
          </div>
        </Card>
      ) : (
        loans.map((loan) => (
          <Card key={loan.loanId} className="p-4 sm:p-6 transition-all duration-300 hover:shadow-lg" style={{
            backgroundColor: "rgba(255, 255, 255, 0.25)",
            borderColor: loan.shouldExercise && !loan.putExercised
              ? "rgba(34, 197, 94, 0.3)"
              : "rgba(99, 179, 237, 0.08)",
            backdropFilter: "blur(20px)",
          }}>
            {/* Loan Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <h3 className="text-lg sm:text-xl font-bold" style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    color: "#2D3748",
                  }}>
                    LOAN_#{loan.loanId} - {loan.stockSymbol}
                  </h3>
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {loan.putExercised && (
                      <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-800 rounded-full">
                        EXERCISED
                      </span>
                    )}
                    {loan.shouldExercise && !loan.putExercised && (
                      <span className="px-2 py-1 text-xs font-bold bg-orange-100 text-orange-800 rounded-full animate-pulse">
                        IN_THE_MONEY
                      </span>
                    )}
                    {Number(loan.claimableRewards) > 0 && (
                      <span className="px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                        REWARDS_READY
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Loan Amount: {formatCurrency((Number(loan.loanAmount) / 1e6).toString())}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {formatTimeRemaining(loan.expiration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Put Option Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-3 rounded-lg" style={{
                backgroundColor: "rgba(99, 179, 237, 0.04)",
                border: "1px solid rgba(99, 179, 237, 0.1)",
              }}>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Current Price</p>
                <p className="text-base sm:text-lg font-bold text-gray-700">
                  {formatCurrency((Number(loan.currentPrice) / 1e8).toString())}
                </p>
              </div>

              <div className="text-center p-3 rounded-lg" style={{
                backgroundColor: "rgba(99, 179, 237, 0.04)",
                border: "1px solid rgba(99, 179, 237, 0.1)",
              }}>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Strike Price</p>
                <p className="text-base sm:text-lg font-bold text-gray-700">
                  {formatCurrency((Number(loan.putStrike) / 1e8).toString())}
                </p>
              </div>

              <div className="text-center p-3 rounded-lg" style={{
                backgroundColor: "rgba(99, 179, 237, 0.04)",
                border: "1px solid rgba(99, 179, 237, 0.1)",
              }}>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Premium Paid</p>
                <p className="text-base sm:text-lg font-bold text-gray-700">
                  {formatCurrency((Number(loan.putPremium) / 1e6).toString())}
                </p>
              </div>

              <div className="text-center p-3 rounded-lg" style={{
                backgroundColor: loan.shouldExercise
                  ? "rgba(34, 197, 94, 0.04)"
                  : "rgba(239, 68, 68, 0.04)",
                border: loan.shouldExercise
                  ? "1px solid rgba(34, 197, 94, 0.1)"
                  : "1px solid rgba(239, 68, 68, 0.1)",
              }}>
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Intrinsic Value</p>
                <p className={`text-base sm:text-lg font-bold ${loan.shouldExercise ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency((Number(loan.intrinsicValue) / 1e6).toString())}
                </p>
              </div>
            </div>

            {/* Claimable Rewards */}
            {Number(loan.claimableRewards) > 0 && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg" style={{
                backgroundColor: "rgba(34, 197, 94, 0.04)",
                border: "1px solid rgba(34, 197, 94, 0.1)",
              }}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    <span className="text-sm sm:text-base font-semibold text-green-700">
                      USDC Rewards Ready to Claim
                    </span>
                  </div>
                  <span className="text-lg sm:text-xl font-bold text-green-700">
                    {formatCurrency((Number(loan.claimableRewards) / 1e6).toString())}
                  </span>
                </div>
              </div>
            )}

            {/* Profit/Loss Indicator */}
            <div className="mb-4 sm:mb-6">
              {loan.shouldExercise ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    <strong>Put option is in-the-money!</strong> You can exercise for a profit of approximately {' '}
                    {formatCurrency((Number(loan.intrinsicValue) / 1e6).toString())} per share.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-orange-700">
                    Put option is out-of-the-money. Current price is above strike price.
                    Premium paid: {formatCurrency((Number(loan.putPremium) / 1e6).toString())}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              {/* Exercise Button */}
              {loan.putExercised ? (
                <Button disabled className="px-6 sm:px-8 py-3 text-base sm:text-lg font-bold" style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  background: "rgba(156, 163, 175, 0.5)",
                  color: "white",
                }}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ALREADY_EXERCISED
                </Button>
              ) : loan.shouldExercise ? (
                <Button
                  onClick={() => handleExercise(loan.loanId)}
                  disabled={exercisingLoanId === loan.loanId}
                  className="px-6 sm:px-8 py-3 text-base sm:text-lg font-bold text-white"
                  style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                    background: "linear-gradient(135deg, #34D399 0%, #10B981 100%)",
                  }}
                >
                  {exercisingLoanId === loan.loanId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      EXERCISING...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      EXERCISE_PUT_OPTION
                    </>
                  )}
                </Button>
              ) : (
                <Button disabled className="px-6 sm:px-8 py-3 text-base sm:text-lg font-bold" style={{
                  fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                  background: "rgba(156, 163, 175, 0.5)",
                  color: "white",
                }}>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  OUT_OF_THE_MONEY
                </Button>
              )}

              {/* Claim Rewards Button */}
              {Number(loan.claimableRewards) > 0 && !loan.rewardsClaimed && (
                <Button
                  onClick={() => handleClaimRewards(loan.loanId)}
                  disabled={claimingLoanId === loan.loanId}
                  className="px-6 sm:px-8 py-3 text-base sm:text-lg font-bold text-white"
                  style={{
                    fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  }}
                >
                  {claimingLoanId === loan.loanId ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      CLAIMING...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      CLAIM_USDC_REWARDS
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Educational Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs sm:text-sm text-blue-700">
                <p className="font-semibold mb-1">How Put Options Work:</p>
                <p>
                  Put options give you the right to "sell" your collateral at the strike price.
                  If the stock price drops below the strike, you can exercise the option to receive
                  protection payments from the protocol's insurance fund.
                </p>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )
} 