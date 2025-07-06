export interface TokenConfig {
    address: string
    name: string
    symbol: string
    decimals: number
    isActive: boolean
    ltv?: number // Loan-to-Value ratio in basis points (for collateral tokens)
    priceFeed?: string // Chainlink price feed address
}

export interface NetworkConfig {
    usdc: TokenConfig
    tokens: Record<string, TokenConfig>
}

export const TESTNET_ADDRESSES: Record<string, NetworkConfig> = {
    sepolia: {
        usdc: {
            address: '0x2b9Ca0A8C773bb1B92A3dDAE9F882Fd14457DACc',
            name: 'Mock USDC',
            symbol: 'USDC',
            decimals: 6,
            isActive: true,
        },
        tokens: {
            USDT: {
                address: '0x18fDA3c97Ea92A04D1636D84948624b414D0058E',
                name: 'Mock USDT',
                symbol: 'USDT',
                decimals: 6,
                isActive: true,
                ltv: 7000, // 70% LTV
            },
            USDS: {
                address: '0xfC7b006bDEd8e5D4A55FbaC7A91dAf3753f085CD',
                name: 'Mock USDS',
                symbol: 'USDS',
                decimals: 18,
                isActive: true,
                ltv: 6500, // 65% LTV
            },
            WBTC: {
                address: '0xd67A804510739C33c578162A26324C83DCFC0a0A',
                name: 'Mock WBTC',
                symbol: 'WBTC',
                decimals: 8,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbETH: {
                address: '0x4CcD4CbDE5Ec758cCBf75f0be280647Ff359c17a',
                name: 'vbETH',
                symbol: 'vbETH',
                decimals: 18,
                isActive: true,
                ltv: 8000, // 80% LTV
            },
            vbUSDC: {
                address: '0x4C8414eBFE5A55eA5859aF373371EE3233fFF7CD',
                name: 'vbUSDC',
                symbol: 'vbUSDC',
                decimals: 6,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbUSDT: {
                address: '0xb3f50565f611D645e0DDB44eB09c4588B1601514',
                name: 'vbUSDT',
                symbol: 'vbUSDT',
                decimals: 6,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbWBTC: {
                address: '0xa278D086289f71a30D237feccBAF3698E43Bc5D6',
                name: 'vbWBTC',
                symbol: 'vbWBTC',
                decimals: 8,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbUSDS: {
                address: '0x56b89A124376CB0481c93C3d94f821F262Dc0D7A',
                name: 'vbUSDS',
                symbol: 'vbUSDS',
                decimals: 18,
                isActive: true,
                ltv: 7000, // 70% LTV
            },
        },
    },
    'base-sepolia': {
        usdc: {
            address: '0x3c95BB5f49F3643558aa8F699403564A652FBeB0',
            name: 'Mock USDC BaseSepolia',
            symbol: 'USDC',
            decimals: 6,
            isActive: true,
        },
        tokens: {},
    },
    tatara: {
        usdc: {
            address: '0xC4AB7Ee524E99FDe68BE962d603768B60944C20d',
            name: 'Mock USDC',
            symbol: 'USDC',
            decimals: 6,
            isActive: true,
        },
        tokens: {
            AAPL: {
                address: '0x3990e910E03b8B79E9df9f4f0D5082dc5424B42A',
                name: 'Apple Inc Stock',
                symbol: 'AAPL',
                decimals: 18,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            WETH: {
                address: '0x17B8Ee96E3bcB3b04b3e8334de4524520C51caB4',
                name: 'WETH Custom Token',
                symbol: 'WETH',
                decimals: 18,
                isActive: true,
                ltv: 8000, // 80% LTV
            },
            WETH_CONVERTER: {
                address: '0x3aFbD158CF7B1E6BE4dAC88bC173FA65EBDf2EcD',
                name: 'WETH Native Converter',
                symbol: 'WETH',
                decimals: 18,
                isActive: true,
                ltv: 8000, // 80% LTV
            },
            vbUSDC_CONVERTER: {
                address: '0x28FDCaF075242719b16D342866c9dd84cC459533',
                name: 'vbUSDC Native Converter',
                symbol: 'vbUSDC',
                decimals: 6,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbUSDT_CUSTOM: {
                address: '0xDe51Ef59663e79B494E1236551187399D3359C92',
                name: 'vbUSDT Custom Token',
                symbol: 'vbUSDT',
                decimals: 6,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbUSDT_CONVERTER: {
                address: '0x8f3a47e64d3AD1fBdC5C23adD53183CcCD05D8a4',
                name: 'vbUSDT Native Converter',
                symbol: 'vbUSDT',
                decimals: 6,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbWBTC_CUSTOM: {
                address: '0x1538aDF273f6f13CcdcdBa41A5ce4b2DC2177D1C',
                name: 'vbWBTC Custom Token',
                symbol: 'vbWBTC',
                decimals: 8,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbWBTC_CONVERTER: {
                address: '0x3Ef265DD0b4B86fC51b08D5B03699E57d52C9B27',
                name: 'vbWBTC Native Converter',
                symbol: 'vbWBTC',
                decimals: 8,
                isActive: true,
                ltv: 7500, // 75% LTV
            },
            vbUSDS_CUSTOM: {
                address: '0xD416d04845d299bCC0e5105414C99fFc88f0C97d',
                name: 'vbUSDS Custom Token',
                symbol: 'vbUSDS',
                decimals: 18,
                isActive: true,
                ltv: 7000, // 70% LTV
            },
            vbUSDS_CONVERTER: {
                address: '0x56342E6093381E2Bd732FFd6141b22136efB98Bf',
                name: 'vbUSDS Native Converter',
                symbol: 'vbUSDS',
                decimals: 18,
                isActive: true,
                ltv: 7000, // 70% LTV
            },
        },
    },
}

export function getNetworkConfig(networkName: string): NetworkConfig | undefined {
    return TESTNET_ADDRESSES[networkName]
}

export function getUSDCAddress(networkName: string): string | undefined {
    return TESTNET_ADDRESSES[networkName]?.usdc?.address
}
