"use client"

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Play,
    CheckCircle,
    Loader2,
    Calculator,
    TrendingDown,
    Shield,
    Zap,
    ArrowRight
} from 'lucide-react'
import { useStockLendContract, formatCurrency } from '@/lib/hooks/useContract'
import toast from 'react-hot-toast'

interface DemoStep {
    id: number
    title: string
    description: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    data?: any
}

interface DemoData {
    aliceShares?: number
    sharePrice?: number
    portfolioValue?: number
    blackScholes?: {
        loanAmount: number
        duration: number
        volatility: number
        currentPrice: number
        budgetPrime: number
        yieldLoan: number
        protocolFees: number
        optimalStrike: number
        putPremium: number
    }
    loanId?: number
    loanCreated?: boolean
    priceScenarios?: Array<{
        name: string
        price: number
        shouldExercise: boolean
    }>
    automationReady?: boolean
    protectionPayout?: number
    optionExercised?: boolean
}

export default function DemoComponent() {
    const { address, isConnected } = useAccount()
    const [currentStep, setCurrentStep] = useState(0)
    const [isRunning, setIsRunning] = useState(false)
    const [demoData, setDemoData] = useState<DemoData>({})

    const { createLoan, exercisePutOption } = useStockLendContract()

    const [steps, setSteps] = useState<DemoStep[]>([
        {
            id: 1,
            title: "Setup Alice's Portfolio",
            description: "Initialize Alice with 100 AAPL shares worth $20,000",
            status: 'pending'
        },
        {
            id: 2,
            title: "Black-Scholes Formula Demo",
            description: "Calculate optimal put option parameters using Black-Scholes",
            status: 'pending'
        },
        {
            id: 3,
            title: "Create Protected Loan",
            description: "Alice borrows $12,000 USDC with put option protection",
            status: 'pending'
        },
        {
            id: 4,
            title: "Price Scenario Testing",
            description: "Test different AAPL price scenarios (OTM, ITM, Deep ITM)",
            status: 'pending'
        },
        {
            id: 5,
            title: "Automation Demo",
            description: "Show Chainlink automation for put option exercise",
            status: 'pending'
        },
        {
            id: 6,
            title: "Exercise Put Option",
            description: "Exercise put option and claim protection rewards",
            status: 'pending'
        }
    ])

    // Step 1: Setup Alice's Portfolio
    const setupAlicePortfolio = async () => {
        updateStepStatus(1, 'running')

        try {
            // Simulate Alice having 100 AAPL shares
            const aliceShares = 100
            const sharePrice = 200
            const portfolioValue = aliceShares * sharePrice

            setDemoData(prev => ({
                ...prev,
                aliceShares,
                sharePrice,
                portfolioValue
            }))

            await new Promise(resolve => setTimeout(resolve, 1000))

            updateStepStatus(1, 'completed')
            toast.success('Alice\'s portfolio initialized!')
        } catch (error) {
            updateStepStatus(1, 'failed')
            toast.error('Failed to setup portfolio')
        }
    }

    // Step 2: Black-Scholes Formula Demo
    const demonstrateBlackScholes = async () => {
        updateStepStatus(2, 'running')

        try {
            // Simulate Black-Scholes calculation
            const loanAmount = 12000
            const duration = 90 // days
            const volatility = 0.3 // 30%
            const currentPrice = 200

            // Simulate calculations (in real demo, these come from contract)
            const budgetPrime = loanAmount * 0.85 // 85% of loan for yield
            const yieldLoan = budgetPrime * 0.125 * (duration / 365) // 12.5% APY
            const protocolFees = loanAmount * 0.005 // 0.5% fee
            const optimalStrike = currentPrice * 0.95 // 5% below current price
            const putPremium = loanAmount * 0.025 // 2.5% premium

            setDemoData(prev => ({
                ...prev,
                blackScholes: {
                    loanAmount,
                    duration,
                    volatility,
                    currentPrice,
                    budgetPrime,
                    yieldLoan,
                    protocolFees,
                    optimalStrike,
                    putPremium
                }
            }))

            await new Promise(resolve => setTimeout(resolve, 2000))

            updateStepStatus(2, 'completed')
            toast.success('Black-Scholes calculations completed!')
        } catch (error) {
            updateStepStatus(2, 'failed')
            toast.error('Failed to calculate Black-Scholes')
        }
    }

    // Step 3: Create Protected Loan
    const createProtectedLoan = async () => {
        updateStepStatus(3, 'running')

        try {
            // This would call the actual contract
            // await createLoan(aaplTokenAddress, '100', '12000', 90 * 24 * 60 * 60)

            // Simulate loan creation
            const loanId = Math.floor(Math.random() * 1000)

            setDemoData(prev => ({
                ...prev,
                loanId,
                loanCreated: true
            }))

            await new Promise(resolve => setTimeout(resolve, 2000))

            updateStepStatus(3, 'completed')
            toast.success('Protected loan created!')
        } catch (error) {
            updateStepStatus(3, 'failed')
            toast.error('Failed to create loan')
        }
    }

    // Step 4: Price Scenario Testing
    const testPriceScenarios = async () => {
        updateStepStatus(4, 'running')

        try {
            const scenarios = [
                { name: 'Minor Drop (OTM)', price: 195, shouldExercise: false },
                { name: 'Moderate Drop (ITM)', price: 185, shouldExercise: true },
                { name: 'Major Crash (Deep ITM)', price: 160, shouldExercise: true }
            ]

            for (const scenario of scenarios) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                toast.success(`Testing ${scenario.name}: $${scenario.price}`)
            }

            setDemoData(prev => ({
                ...prev,
                priceScenarios: scenarios
            }))

            updateStepStatus(4, 'completed')
            toast.success('Price scenarios tested!')
        } catch (error) {
            updateStepStatus(4, 'failed')
            toast.error('Failed to test price scenarios')
        }
    }

    // Step 5: Automation Demo
    const demonstrateAutomation = async () => {
        updateStepStatus(5, 'running')

        try {
            // Simulate automation check
            await new Promise(resolve => setTimeout(resolve, 1500))

            const automationReady = true

            setDemoData(prev => ({
                ...prev,
                automationReady
            }))

            updateStepStatus(5, 'completed')
            toast.success('Chainlink automation ready!')
        } catch (error) {
            updateStepStatus(5, 'failed')
            toast.error('Failed to setup automation')
        }
    }

    // Step 6: Exercise Put Option
    const exerciseOption = async () => {
        updateStepStatus(6, 'running')

        try {
            // This would call the actual contract
            // await exercisePutOption(demoData.loanId)

            // Simulate option exercise
            const protectionPayout = 1500 // $1,500 protection

            setDemoData(prev => ({
                ...prev,
                protectionPayout,
                optionExercised: true
            }))

            await new Promise(resolve => setTimeout(resolve, 2000))

            updateStepStatus(6, 'completed')
            toast.success('Put option exercised successfully!')
        } catch (error) {
            updateStepStatus(6, 'failed')
            toast.error('Failed to exercise option')
        }
    }

    const updateStepStatus = (stepId: number, status: DemoStep['status']) => {
        setSteps(prev =>
            prev.map(step =>
                step.id === stepId ? { ...step, status } : step
            )
        )
    }

    const runDemo = async () => {
        setIsRunning(true)
        setCurrentStep(0)

        try {
            // Reset all steps
            setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))

            // Run each step
            await setupAlicePortfolio()
            setCurrentStep(1)

            await demonstrateBlackScholes()
            setCurrentStep(2)

            await createProtectedLoan()
            setCurrentStep(3)

            await testPriceScenarios()
            setCurrentStep(4)

            await demonstrateAutomation()
            setCurrentStep(5)

            await exerciseOption()
            setCurrentStep(6)

            toast.success('🎉 Demo completed successfully!')
        } catch (error) {
            console.error('Demo failed:', error)
            toast.error('Demo failed')
        } finally {
            setIsRunning(false)
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
                    <Play className="w-16 h-16 text-purple-400" />
                    <h3 className="text-xl font-bold text-gray-700">Connect Wallet for Demo</h3>
                    <p className="text-gray-600">Connect your wallet to run Alice's put option demo</p>
                </div>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6" style={{
                backgroundColor: "rgba(255, 255, 255, 0.25)",
                borderColor: "rgba(99, 179, 237, 0.08)",
                backdropFilter: "blur(20px)",
            }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold" style={{
                            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            color: "#2D3748",
                        }}>
                            ALICE_PUT_OPTION_DEMO
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Interactive demonstration of Black-Scholes put option hedging
                        </p>
                    </div>

                    <Button
                        onClick={runDemo}
                        disabled={isRunning}
                        className="px-8 py-4 text-lg font-bold text-white"
                        style={{
                            fontFamily: "'GT Standard Mono', 'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
                            background: "linear-gradient(135deg, #9F7AEA 0%, #805AD5 100%)",
                        }}
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                RUNNING_DEMO...
                            </>
                        ) : (
                            <>
                                <Play className="w-5 h-5 mr-2" />
                                START_DEMO
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Demo Steps */}
            <div className="space-y-4">
                {steps.map((step, index) => (
                    <Card key={step.id} className="p-4" style={{
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        borderColor: step.status === 'completed'
                            ? "rgba(34, 197, 94, 0.3)"
                            : step.status === 'running'
                                ? "rgba(59, 130, 246, 0.3)"
                                : "rgba(99, 179, 237, 0.08)",
                        backdropFilter: "blur(20px)",
                    }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{
                                    backgroundColor: step.status === 'completed'
                                        ? "#10B981"
                                        : step.status === 'running'
                                            ? "#3B82F6"
                                            : "#9CA3AF"
                                }}>
                                    {step.status === 'completed' ? (
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    ) : step.status === 'running' ? (
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    ) : (
                                        <span className="text-white font-bold text-sm">{step.id}</span>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-800">{step.title}</h3>
                                    <p className="text-sm text-gray-600">{step.description}</p>
                                </div>
                            </div>

                            {currentStep === index && (
                                <ArrowRight className="w-5 h-5 text-blue-500" />
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Demo Data Display */}
            {Object.keys(demoData).length > 0 && (
                <Card className="p-6" style={{
                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                    borderColor: "rgba(99, 179, 237, 0.08)",
                    backdropFilter: "blur(20px)",
                }}>
                    <h3 className="text-lg font-bold mb-4">Demo Results</h3>

                    {demoData.blackScholes && (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-blue-50 rounded">
                                <p className="text-sm text-gray-600">Budget Prime</p>
                                <p className="text-lg font-bold">{formatCurrency(demoData.blackScholes.budgetPrime.toString())}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded">
                                <p className="text-sm text-gray-600">Yield Loan</p>
                                <p className="text-lg font-bold">{formatCurrency(demoData.blackScholes.yieldLoan.toString())}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded">
                                <p className="text-sm text-gray-600">Optimal Strike</p>
                                <p className="text-lg font-bold">{formatCurrency(demoData.blackScholes.optimalStrike.toString())}</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded">
                                <p className="text-sm text-gray-600">Put Premium</p>
                                <p className="text-lg font-bold">{formatCurrency(demoData.blackScholes.putPremium.toString())}</p>
                            </div>
                        </div>
                    )}

                    {demoData.protectionPayout && (
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Protection activated!</strong> Alice received {formatCurrency(demoData.protectionPayout.toString())} in protection payout.
                            </AlertDescription>
                        </Alert>
                    )}
                </Card>
            )}
        </div>
    )
} 