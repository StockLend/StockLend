import { Address } from 'viem'

// ===========================
// CONTRACT ADDRESSES
// ===========================

export const STOCK_LEND_PROTOCOL_ADDRESSES: Record<number, Address> = {
  // Sepolia testnet
  11155111: '0x93ffB6E0C3cbAa3A8301696653cA49F71F88d91b', // ✅ DEPLOYED
  // Arbitrum Sepolia  
  421614: '0x0000000000000000000000000000000000000000', // UPDATE WHEN DEPLOYED
  // Katana testnet
  128886: '0x93ffB6E0C3cbAa3A8301696653cA49F71F88d91b', // Using Sepolia address for testing
  129399: '0x93ffB6E0C3cbAa3A8301696653cA49F71F88d91b', // Using Sepolia address for testing
}

// Token addresses from backend config
export const TOKEN_ADDRESSES = {
  sepolia: {
    USDC: '0x2b9Ca0A8C773bb1B92A3dDAE9F882Fd14457DACc' as Address,
    USDT: '0x18fDA3c97Ea92A04D1636D84948624b414D0058E' as Address,
    WBTC: '0xd67A804510739C33c578162A26324C83DCFC0a0A' as Address,
    // Deployed stock tokens on Sepolia
    AAPL: '0xC908b45d6205c01148934a7dE66164283bEf6907' as Address, // ✅ DEPLOYED - Apple Inc Stock
  },
  arbitrumSepolia: {
    USDC: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' as Address,
    // Add other tokens when deployed
  },
  katana: {
    USDC: '0xC4AB7Ee524E99FDe68BE962d603768B60944C20d' as Address,
    WETH: '0x17B8Ee96E3bcB3b04b3e8334de4524520C51caB4' as Address,
    AAPL: '0x3990e910E03b8B79E9df9f4f0D5082dc5424B42A' as Address,
    // Add stock tokens when deployed
  }
} as const

// ===========================
// PRICE FEED ADDRESSES (for reference)
// ===========================

export const PRICE_FEED_ADDRESSES = {
  sepolia: {
    AAPL: '0x468a61963ee382a62292438f108F5D522ec13215' as Address, // $200 AAPL Price Feed
    TSLA: '0xD644Ac104A4d7C856d7a351fa80c5799749a909c' as Address, // $250 TSLA Price Feed
  }
} as const

// ===========================
// CONTRACT ABIs
// ===========================

// StockLendProtocolV3 ABI - Essential functions only
export const STOCK_LEND_PROTOCOL_ABI = [
  // Create loan
  {
    name: 'createLoanV3',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'stockToken', type: 'address' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: []
  },
  // Repay loan
  {
    name: 'repayLoan',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'loanId', type: 'uint256' }],
    outputs: []
  },
  // Exercise put option
  {
    name: 'exercisePutOption',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'loanId', type: 'uint256' }],
    outputs: []
  },
  // Get loan details
  {
    name: 'getLoanDetails',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'loanId', type: 'uint256' }],
    outputs: [
      {
        name: 'loan',
        type: 'tuple',
        components: [
          { name: 'borrower', type: 'address' },
          { name: 'stockToken', type: 'address' },
          { name: 'collateralAmount', type: 'uint256' },
          { name: 'loanAmount', type: 'uint256' },
          { name: 'putStrike', type: 'uint256' },
          { name: 'putPremium', type: 'uint256' },
          { name: 'expiration', type: 'uint256' },
          { name: 'targetYield', type: 'uint256' },
          { name: 'protocolFee', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
          { name: 'putExercised', type: 'bool' },
          { name: 'creationPrice', type: 'uint256' },
          { name: 'volatilityUsed', type: 'uint256' }
        ]
      },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'intrinsicValue', type: 'uint256' },
      { name: 'shouldExercise', type: 'bool' }
    ]
  },
  // Preview loan calculation
  {
    name: 'previewLoanCalculation',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'stockToken', type: 'address' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'duration', type: 'uint256' }
    ],
    outputs: [
      { name: 'currentPrice', type: 'uint256' },
      { name: 'volatility', type: 'uint256' },
      { name: 'budgetPrime', type: 'uint256' },
      { name: 'yieldLoan', type: 'uint256' },
      { name: 'protocolFees', type: 'uint256' },
      { name: 'primeBudget', type: 'uint256' },
      { name: 'optimalStrike', type: 'uint256' },
      { name: 'actualPremium', type: 'uint256' },
      { name: 'totalYield', type: 'uint256' }
    ]
  },
  // Get user loans
  {
    name: 'getUserLoans',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }]
  },
  // Get protocol stats
  {
    name: 'getProtocolStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalProtectionFund', type: 'uint256' },
      { name: 'totalProtocolFees', type: 'uint256' },
      { name: 'totalActiveLoans', type: 'uint256' },
      { name: 'baseYieldRate', type: 'uint256' }
    ]
  },
  // Add stock asset
  {
    name: 'addStockAssetV3',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'priceFeed', type: 'address' },
      { name: 'volatilityFeed', type: 'address' },
      { name: 'ltv', type: 'uint256' },
      { name: 'useRealVolatility', type: 'bool' }
    ],
    outputs: []
  },
  // Events
  {
    name: 'LoanV3Created',
    type: 'event',
    inputs: [
      { name: 'loanId', type: 'uint256', indexed: true },
      { name: 'borrower', type: 'address', indexed: true },
      { name: 'stockToken', type: 'address' },
      { name: 'collateralAmount', type: 'uint256' },
      { name: 'loanAmount', type: 'uint256' },
      { name: 'putStrike', type: 'uint256' },
      { name: 'putPremium', type: 'uint256' },
      { name: 'targetYield', type: 'uint256' },
      { name: 'expiration', type: 'uint256' }
    ]
  },
  {
    name: 'LoanRepaid',
    type: 'event',
    inputs: [
      { name: 'loanId', type: 'uint256', indexed: true },
      { name: 'repayAmount', type: 'uint256' }
    ]
  },
  {
    name: 'PutOptionExercisedV3',
    type: 'event',
    inputs: [
      { name: 'loanId', type: 'uint256', indexed: true },
      { name: 'protectionPayout', type: 'uint256' },
      { name: 'currentPrice', type: 'uint256' },
      { name: 'putStrike', type: 'uint256' },
      { name: 'premiumUsed', type: 'uint256' }
    ]
  }
] as const

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }]
  }
] as const

// ===========================
// HELPER FUNCTIONS
// ===========================

export function getStockLendProtocolAddress(chainId: number): Address {
  console.log(`Getting protocol address for chainId: ${chainId}`)
  
  // Pour le développement, si l'adresse n'est pas définie, utiliser l'adresse de Sepolia
  if (!STOCK_LEND_PROTOCOL_ADDRESSES[chainId]) {
    console.warn(`Protocol address not defined for chainId ${chainId}, using fallback address`)
    return STOCK_LEND_PROTOCOL_ADDRESSES[11155111] // Utiliser l'adresse de Sepolia comme fallback
  }
  
  const address = STOCK_LEND_PROTOCOL_ADDRESSES[chainId]
  
  // Si l'adresse est l'adresse zéro, utiliser également l'adresse de Sepolia
  if (address === '0x0000000000000000000000000000000000000000') {
    console.warn(`Protocol address is zero address for chainId ${chainId}, using fallback address`)
    return STOCK_LEND_PROTOCOL_ADDRESSES[11155111]
  }
  
  console.log(`Found protocol address for chainId ${chainId}: ${address}`)
  return address
}

export function getTokenAddress(chainId: number, tokenSymbol: string): Address {
  const networkName = getNetworkName(chainId)
  console.log(`Getting token address for ${tokenSymbol} on network ${networkName} (chainId: ${chainId})`)
  
  const tokens = TOKEN_ADDRESSES[networkName]
  if (!tokens) {
    console.error(`No tokens defined for network ${networkName}`)
    throw new Error(`Token ${tokenSymbol} not found on chain ${chainId}`)
  }
  
  if (!tokens[tokenSymbol as keyof typeof tokens]) {
    console.error(`Token ${tokenSymbol} not defined on network ${networkName}`)
    throw new Error(`Token ${tokenSymbol} not found on chain ${chainId}`)
  }
  
  const address = tokens[tokenSymbol as keyof typeof tokens]
  console.log(`Found address for ${tokenSymbol}: ${address}`)
  return address
}

function getNetworkName(chainId: number): keyof typeof TOKEN_ADDRESSES {
  console.log(`Getting network name for chainId: ${chainId}`)
  
  let networkName: keyof typeof TOKEN_ADDRESSES
  switch (chainId) {
    case 11155111:
      networkName = 'sepolia'
      break
    case 421614:
      networkName = 'arbitrumSepolia'
      break
    case 128886:
    case 129399:
      networkName = 'katana'
      break
    default:
      console.error(`Unsupported chain ID: ${chainId}`)
      throw new Error(`Unsupported chain ID: ${chainId}`)
  }
  
  console.log(`Network name for chainId ${chainId}: ${networkName}`)
  return networkName
}

// ===========================
// CONSTANTS
// ===========================

export const SUPPORTED_STOCK_TOKENS = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' }
] as const

export const LOAN_DURATION_OPTIONS = [
  { value: 30 * 24 * 60 * 60, label: '30 days' },
  { value: 60 * 24 * 60 * 60, label: '60 days' },
  { value: 90 * 24 * 60 * 60, label: '90 days' },
  { value: 120 * 24 * 60 * 60, label: '120 days' },
  { value: 180 * 24 * 60 * 60, label: '180 days' }
] as const

// ===========================
// DEPLOYMENT INFO (for reference)
// ===========================

export const DEPLOYMENT_INFO = {
  sepolia: {
    StockLendProtocolV3: '0x93ffB6E0C3cbAa3A8301696653cA49F71F88d91b',
    AAPL_Token: '0xC908b45d6205c01148934a7dE66164283bEf6907',
    AAPL_PriceFeed: '0x468a61963ee382a62292438f108F5D522ec13215',
    TSLA_PriceFeed: '0xD644Ac104A4d7C856d7a351fa80c5799749a909c',
    USDC: '0x2b9Ca0A8C773bb1B92A3dDAE9F882Fd14457DACc',
    features: [
      'Black-Scholes Put Pricing',
      'Dynamic Strike Calculation', 
      'USDC Yield Optimization (3.75% base)',
      'Gas-Optimized Math Functions'
    ]
  }
} as const 