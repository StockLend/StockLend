"use client"

import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem'
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  STOCK_LEND_PROTOCOL_ABI,
  ERC20_ABI,
  getStockLendProtocolAddress,
  getTokenAddress,
  SUPPORTED_STOCK_TOKENS,
  LOAN_DURATION_OPTIONS
} from '@/lib/contracts'

// ===========================
// TYPES
// ===========================

export interface LoanData {
  borrower: string
  stockToken: string
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
  volatilityUsed: bigint
}

export interface LoanPreview {
  currentPrice: bigint
  volatility: bigint
  budgetPrime: bigint
  yieldLoan: bigint
  protocolFees: bigint
  primeBudget: bigint
  optimalStrike: bigint
  actualPremium: bigint
  totalYield: bigint
}

export interface ProtocolStats {
  totalProtectionFund: bigint
  totalProtocolFees: bigint
  totalActiveLoans: bigint
  baseYieldRate: bigint
}

// ===========================
// HOOK: useStockLendContract
// ===========================

export function useStockLendContract() {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Get protocol address for current chain
  const getProtocolAddress = () => {
    try {
      return getStockLendProtocolAddress(chainId)
    } catch (error) {
      console.error('Protocol not deployed on this network')
      return undefined
    }
  }

  // ===========================
  // SUPPLY USDC
  // ===========================

  const supplyUSDC = async (amount: string) => {
    const protocolAddress = getProtocolAddress()
    if (!protocolAddress) {
      toast.error('Protocol not available on this network')
      return
    }

    try {
      setIsLoading(true)
      console.log(`Supplying ${amount} USDC to protocol ${protocolAddress}`)
      
      // Convert amount based on USDC decimals (6)
      const amountWei = parseUnits(amount, 6)
      
      // Get USDC token address
      const usdcAddress = getTokenAddress(chainId, 'USDC')
      
      // Use ERC20 transfer to send USDC to the protocol
      await writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [protocolAddress, amountWei]
      })

      toast.success('Supplying USDC...')
    } catch (error: any) {
      console.error('Error supplying USDC:', error)
      toast.error(`Failed to supply USDC: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================
  // CREATE LOAN
  // ===========================

  const createLoan = async (
    stockToken: `0x${string}`,
    collateralAmount: string,
    loanAmount: string,
    duration: number
  ) => {
    const protocolAddress = getProtocolAddress()
    if (!protocolAddress) {
      toast.error('Protocol not available on this network')
      return
    }

    try {
      setIsLoading(true)
      
      // Convert amounts based on token decimals
      const collateralAmountWei = parseEther(collateralAmount) // Assuming 18 decimals for stock tokens
      const loanAmountWei = parseUnits(loanAmount, 6) // USDC has 6 decimals
      
      await writeContract({
        address: protocolAddress,
        abi: STOCK_LEND_PROTOCOL_ABI,
        functionName: 'createLoanV3',
        args: [stockToken, collateralAmountWei, loanAmountWei, BigInt(duration)]
      })

      toast.success('Creating loan...')
    } catch (error: any) {
      console.error('Error creating loan:', error)
      toast.error(`Failed to create loan: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================
  // REPAY LOAN
  // ===========================

  const repayLoan = async (loanId: number) => {
    const protocolAddress = getProtocolAddress()
    if (!protocolAddress) {
      toast.error('Protocol not available on this network')
      return
    }

    try {
      setIsLoading(true)
      
      await writeContract({
        address: protocolAddress,
        abi: STOCK_LEND_PROTOCOL_ABI,
        functionName: 'repayLoan',
        args: [BigInt(loanId)]
      })

      toast.success('Repaying loan...')
    } catch (error: any) {
      console.error('Error repaying loan:', error)
      toast.error(`Failed to repay loan: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // ===========================
  // EXERCISE PUT OPTION
  // ===========================

  const exercisePutOption = async (loanId: number) => {
    const protocolAddress = getProtocolAddress()
    if (!protocolAddress) {
      toast.error('Protocol not available on this network')
      return
    }

    try {
      setIsLoading(true)
      
      await writeContract({
        address: protocolAddress,
        abi: STOCK_LEND_PROTOCOL_ABI,
        functionName: 'exercisePutOption',
        args: [BigInt(loanId)]
      })

      toast.success('Exercising put option...')
    } catch (error: any) {
      console.error('Error exercising put option:', error)
      toast.error(`Failed to exercise put option: ${error.message || 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    supplyUSDC,
    createLoan,
    repayLoan,
    exercisePutOption,
    isLoading: isLoading || isWritePending || isTransactionLoading,
    isSuccess: isTransactionSuccess,
    error: writeError,
    txHash: hash
  }
}

// ===========================
// HOOK: useStockLendRead
// ===========================

export function useStockLendRead() {
  const chainId = useChainId()
  const { address } = useAccount()

  const getProtocolAddress = () => {
    try {
      return getStockLendProtocolAddress(chainId)
    } catch (error) {
      return undefined
    }
  }

  // Get loan details
  const { data: loanDetails, refetch: refetchLoanDetails } = useReadContract({
    address: getProtocolAddress(),
    abi: STOCK_LEND_PROTOCOL_ABI,
    functionName: 'getLoanDetails',
    args: [BigInt(0)], // Will be updated when needed
    query: { enabled: false } // Only fetch when explicitly called
  })

  // Preview loan calculation
  const previewLoan = (stockToken: `0x${string}`, loanAmount: string, duration: number) => {
    const protocolAddress = getProtocolAddress()
    if (!protocolAddress) return { data: null, isLoading: false, error: 'Protocol not available' }

    return useReadContract({
      address: protocolAddress,
      abi: STOCK_LEND_PROTOCOL_ABI,
      functionName: 'previewLoanCalculation',
      args: [
        stockToken,
        parseUnits(loanAmount, 6), // USDC decimals
        BigInt(duration)
      ],
      query: { enabled: !!stockToken && !!loanAmount && !!duration }
    })
  }

  // Get user loans
  const { data: userLoans, refetch: refetchUserLoans } = useReadContract({
    address: getProtocolAddress(),
    abi: STOCK_LEND_PROTOCOL_ABI,
    functionName: 'getUserLoans',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!getProtocolAddress() }
  })

  // Get protocol stats
  const { data: protocolStats, refetch: refetchProtocolStats } = useReadContract({
    address: getProtocolAddress(),
    abi: STOCK_LEND_PROTOCOL_ABI,
    functionName: 'getProtocolStats',
    query: { enabled: !!getProtocolAddress() }
  })

  return {
    loanDetails,
    userLoans: userLoans as bigint[] | undefined,
    protocolStats: protocolStats as ProtocolStats | undefined,
    previewLoan,
    refetchLoanDetails,
    refetchUserLoans,
    refetchProtocolStats
  }
}

// ===========================
// HOOK: useTokenBalance
// ===========================

export function useTokenBalance(tokenSymbol?: string) {
  const chainId = useChainId()
  const { address } = useAccount()

  const getTokenAddressForSymbol = (symbol: string) => {
    try {
      console.log(`Getting token address for symbol: ${symbol}, chainId: ${chainId}`)
      const tokenAddress = getTokenAddress(chainId, symbol)
      console.log(`Found token address: ${tokenAddress}`)
      return tokenAddress
    } catch (error) {
      console.error(`Error getting token address for ${symbol}:`, error)
      return undefined
    }
  }

  const tokenAddress = tokenSymbol ? getTokenAddressForSymbol(tokenSymbol) : undefined
  console.log(`Token address for ${tokenSymbol}: ${tokenAddress}, User address: ${address}`)

  const { data: balance, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress }
  })

  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress }
  })

  console.log(`Balance for ${tokenSymbol}: ${balance}, Decimals: ${decimals}`)

  const formattedBalance = balance && decimals 
    ? formatUnits(balance as bigint, decimals as number)
    : '0'

  return {
    balance: balance as bigint | undefined,
    formattedBalance,
    decimals: decimals as number | undefined,
    refetch
  }
}

// ===========================
// HOOK: useTokenApproval
// ===========================

export function useTokenApproval(tokenSymbol?: string) {
  const chainId = useChainId()
  const { address } = useAccount()
  const { writeContract, isPending, error } = useWriteContract()

  const getTokenAddressForSymbol = (symbol: string) => {
    try {
      console.log(`[Approval] Getting token address for ${symbol}, chainId: ${chainId}`)
      const tokenAddress = getTokenAddress(chainId, symbol)
      console.log(`[Approval] Found token address: ${tokenAddress}`)
      return tokenAddress
    } catch (error) {
      console.error(`[Approval] Error getting token address for ${symbol}:`, error)
      return undefined
    }
  }

  const getProtocolAddress = () => {
    try {
      console.log(`[Approval] Getting protocol address for chainId: ${chainId}`)
      const protocolAddress = getStockLendProtocolAddress(chainId)
      console.log(`[Approval] Found protocol address: ${protocolAddress}`)
      return protocolAddress
    } catch (error) {
      console.error(`[Approval] Error getting protocol address:`, error)
      return undefined
    }
  }

  const tokenAddress = tokenSymbol ? getTokenAddressForSymbol(tokenSymbol) : undefined
  const spenderAddress = getProtocolAddress()
  
  console.log(`[Approval] Token address for ${tokenSymbol}: ${tokenAddress}`)
  console.log(`[Approval] Spender address: ${spenderAddress}`)

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spenderAddress ? [address, spenderAddress] : undefined,
    query: { enabled: !!address && !!tokenAddress && !!spenderAddress }
  })

  // Approve token spending
  const approve = async (amount: string, decimals: number = 18) => {
    if (!tokenAddress || !spenderAddress) {
      console.error(`[Approval] Cannot approve: tokenAddress=${tokenAddress}, spenderAddress=${spenderAddress}`)
      toast.error('Token or protocol not available')
      return
    }

    try {
      console.log(`[Approval] Approving ${amount} of ${tokenSymbol} (${decimals} decimals) for ${spenderAddress}`)
      const amountWei = parseUnits(amount, decimals)
      
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, amountWei]
      })

      toast.success('Approving token...')
    } catch (error: any) {
      console.error('Error approving token:', error)
      toast.error(`Failed to approve token: ${error.message || 'Unknown error'}`)
    }
  }

  // Approve unlimited amount
  const approveMax = async () => {
    if (!tokenAddress || !spenderAddress) {
      console.error(`[Approval] Cannot approve max: tokenAddress=${tokenAddress}, spenderAddress=${spenderAddress}`)
      toast.error('Token or protocol not available')
      return
    }

    try {
      const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
      
      await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spenderAddress, maxAmount]
      })

      toast.success('Approving unlimited spending...')
    } catch (error: any) {
      console.error('Error approving token:', error)
      toast.error(`Failed to approve token: ${error.message || 'Unknown error'}`)
    }
  }

  const hasAllowance = (requiredAmount: bigint): boolean => {
    return allowance ? (allowance as bigint) >= requiredAmount : false
  }

  return {
    allowance: allowance as bigint | undefined,
    approve,
    approveMax,
    hasAllowance,
    isApproving: isPending,
    error,
    refetchAllowance
  }
}

// ===========================
// HELPER HOOKS
// ===========================

export function useStockTokens() {
  return SUPPORTED_STOCK_TOKENS
}

export function useLoanDurations() {
  return LOAN_DURATION_OPTIONS
}

// Format utilities
export const formatCurrency = (amount: bigint | string, decimals: number = 6) => {
  const formatted = typeof amount === 'bigint' 
    ? formatUnits(amount, decimals)
    : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(Number(formatted))
}

export const formatPercentage = (rate: bigint) => {
  // Rate is in 18 decimals, convert to percentage
  const percentage = Number(formatEther(rate)) * 100
  return `${percentage.toFixed(2)}%`
}