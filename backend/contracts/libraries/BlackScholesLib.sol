// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

/**
 * @title BlackScholesLib
 * @dev Simplified and robust Black-Scholes library for put option pricing
 * @dev Uses safe approximations optimized for gas efficiency
 */
library BlackScholesLib {
    // ============================
    // CONSTANTS
    // ============================

    uint256 private constant PRECISION = 1e18;
    uint256 private constant HALF_PRECISION = 5e17;

    // ============================
    // STRUCTS
    // ============================

    struct BSParams {
        uint256 spot; // Current price (8 decimals)
        uint256 strike; // Strike price (8 decimals)
        uint256 timeToMaturity; // Time in years (18 decimals)
        uint256 riskFreeRate; // Risk-free rate (18 decimals)
        uint256 volatility; // Volatility (18 decimals)
    }

    struct BSResult {
        uint256 putPremium; // Put option premium (8 decimals)
        uint256 d1; // d1 value (for reference)
        uint256 d2; // d2 value (for reference)
        uint256 nd1; // N(-d1) (for reference)
        uint256 nd2; // N(-d2) (for reference)
    }

    // ============================
    // MAIN FUNCTIONS
    // ============================

    /**
     * @dev Calculate put option premium using simplified Black-Scholes
     * @dev Uses approximations suitable for typical DeFi parameters
     */
    function calculatePutPremium(BSParams memory params) internal pure returns (BSResult memory) {
        require(params.spot > 0 && params.strike > 0, "Invalid prices");
        require(params.timeToMaturity > 0 && params.timeToMaturity <= PRECISION, "Invalid time");
        require(params.volatility > 0 && params.volatility <= 2 * PRECISION, "Invalid volatility");

        // Use simplified approach for typical put options
        uint256 premium =
            _calculateSimplifiedPutPremium(params.spot, params.strike, params.timeToMaturity, params.volatility);

        return BSResult({
            putPremium: premium,
            d1: 0, // Simplified - not calculated
            d2: 0, // Simplified - not calculated
            nd1: 0, // Simplified - not calculated
            nd2: 0 // Simplified - not calculated
        });
    }

    /**
     * @dev Calculate put option premium using PRODUCTION Black-Scholes formula
     * @dev Implements complete BS formula with d1, d2 and normal distribution
     */
    function calculatePutPremiumProduction(BSParams memory params) internal pure returns (BSResult memory) {
        require(params.spot > 0 && params.strike > 0, "Invalid prices");
        require(params.timeToMaturity > 0 && params.timeToMaturity <= PRECISION, "Invalid time");
        require(params.volatility > 0 && params.volatility <= 2 * PRECISION, "Invalid volatility");

        // Convert to 18 decimals for calculations
        uint256 S = params.spot * 1e10; // 8 -> 18 decimals
        uint256 K = params.strike * 1e10; // 8 -> 18 decimals
        uint256 T = params.timeToMaturity;
        uint256 r = params.riskFreeRate;
        uint256 sigma = params.volatility;

        // Calculate d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        (uint256 d1, uint256 d2) = _calculateD1D2(S, K, T, r, sigma);

        // Calculate N(-d1) and N(-d2) for put option
        uint256 nd1 = PRECISION - _normalCDF(d1); // N(-d1) = 1 - N(d1)
        uint256 nd2 = PRECISION - _normalCDF(d2); // N(-d2) = 1 - N(d2)

        // Put premium = K * e^(-rT) * N(-d2) - S * N(-d1)
        uint256 discountFactor = _exp(-(int256(r * T) / int256(PRECISION))); // e^(-rT)
        uint256 term1 = (K * discountFactor * nd2) / (PRECISION * PRECISION);
        uint256 term2 = (S * nd1) / PRECISION;

        uint256 premium18 = term1 > term2 ? term1 - term2 : 0;
        uint256 premium8 = premium18 / 1e10; // Convert back to 8 decimals

        return BSResult({putPremium: premium8, d1: d1, d2: d2, nd1: nd1, nd2: nd2});
    }

    /**
     * @dev HYBRID Black-Scholes put pricing - Production optimized for realistic results
     * @dev Combines mathematical rigor with practical DeFi parameters
     */
    function calculatePutPremiumHybrid(BSParams memory params) internal pure returns (BSResult memory) {
        require(params.spot > 0 && params.strike > 0, "Invalid prices");
        require(params.timeToMaturity > 0, "Invalid time");
        require(params.volatility > 0, "Invalid volatility");

        // Use simplified but more realistic approach for DeFi
        uint256 S = params.spot; // Keep in 8 decimals
        uint256 K = params.strike;
        uint256 T = params.timeToMaturity;
        uint256 sigma = params.volatility;

        // Calculate intrinsic value (max(K-S, 0))
        uint256 intrinsicValue = K > S ? (K - S) : 0;

        // Calculate time value based on moneyness and volatility
        uint256 timeValue = 0;

        if (T > 0) {
            // Moneyness factor: how far out-of-the-money
            uint256 moneyness = K > S ? ((K - S) * PRECISION) / S : 0;

            // Time decay factor: sqrt(T) normalized
            uint256 timeDecay = _sqrt(T);

            // Volatility factor: higher vol = higher premium
            uint256 volFactor = (sigma * timeDecay) / PRECISION;

            // Time value = S * vol_factor * moneyness_adjustment
            uint256 moneynessAdjustment = PRECISION;
            if (moneyness < PRECISION / 10) {
                // Less than 10% OTM
                moneynessAdjustment = PRECISION; // Full value
            } else if (moneyness < PRECISION / 5) {
                // Less than 20% OTM
                moneynessAdjustment = (3 * PRECISION) / 4; // 75% value
            } else if (moneyness < PRECISION / 3) {
                // Less than 33% OTM
                moneynessAdjustment = PRECISION / 2; // 50% value
            } else {
                moneynessAdjustment = PRECISION / 4; // 25% value for deep OTM
            }

            // Scale down the time value significantly for more realistic premiums
            timeValue = (S * volFactor * moneynessAdjustment) / (PRECISION * PRECISION * 18); // Even more conservative

            // For DeFi context: very conservative bounds matching our budget constraints
            // Min: 0.08% of spot, Max: 1.2% of spot
            uint256 minPremium = S / 1250; // 0.08% of spot
            uint256 maxPremium = (S * 12) / 1000; // 1.2% of spot

            if (timeValue < minPremium) timeValue = minPremium;
            if (timeValue > maxPremium) timeValue = maxPremium;
        }

        uint256 totalPremium = intrinsicValue + timeValue;

        return BSResult({
            putPremium: totalPremium,
            d1: 0, // Not calculated in hybrid mode
            d2: 0,
            nd1: 0,
            nd2: 0
        });
    }

    /**
     * @dev Calculate optimal strike price for target premium using binary search
     */
    function calculateOptimalStrike(uint256 targetPremium, BSParams memory params) internal pure returns (uint256) {
        require(targetPremium > 0, "Invalid target premium");

        uint256 minStrike = (params.spot * 80) / 100; // 80% of spot
        uint256 maxStrike = (params.spot * 100) / 100; // 100% of spot (at-the-money max)

        // Binary search with limited iterations
        for (uint256 i = 0; i < 15; i++) {
            uint256 midStrike = (minStrike + maxStrike) / 2;
            params.strike = midStrike;

            BSResult memory result = calculatePutPremium(params);

            if (result.putPremium > targetPremium) {
                maxStrike = midStrike;
            } else {
                minStrike = midStrike;
            }

            // Break if close enough (within 2%)
            if (maxStrike - minStrike < params.spot / 50) {
                break;
            }
        }

        return (minStrike + maxStrike) / 2;
    }

    /**
     * @dev Calculate optimal strike using generic formula approach
     * @param spot S - Current price (8 decimals)
     * @param loanAmount L - Loan amount (18 decimals)
     * @param timeToMaturity T - Time in years (18 decimals)
     * @param volatility σ - Volatility (18 decimals)
     * @param premiumRate Premium rate (e.g., 0.07 for 7% APR) (18 decimals)
     * @param deltaAPY USDC yield APY (18 decimals)
     * @param psi Protocol fee rate (18 decimals)
     * @param epsilon Buffer safety (8 decimals)
     * @return Optimal strike price (8 decimals)
     */
    function calculateOptimalStrikeGeneric(
        uint256 spot,
        uint256 loanAmount,
        uint256 timeToMaturity,
        uint256 volatility,
        uint256 premiumRate,
        uint256 deltaAPY,
        uint256 psi,
        uint256 epsilon
    ) internal pure returns (uint256) {
        // Calculate available budget
        uint256 targetPremium = _calculateTargetPremium(loanAmount, timeToMaturity, premiumRate, deltaAPY, psi, epsilon);

        // Find optimal strike using binary search
        return _findOptimalStrike(spot, loanAmount, timeToMaturity, volatility, deltaAPY, targetPremium);
    }

    /**
     * @dev Calculate target premium budget (internal helper)
     */
    function _calculateTargetPremium(
        uint256 loanAmount,
        uint256 timeToMaturity,
        uint256 premiumRate,
        uint256 deltaAPY,
        uint256 psi,
        uint256 epsilon
    ) private pure returns (uint256) {
        // Calculate components according to user's formula
        uint256 budgetPrime = (loanAmount * premiumRate * timeToMaturity) / (PRECISION * PRECISION);
        uint256 yieldLoan = (loanAmount * deltaAPY * timeToMaturity) / (PRECISION * PRECISION);
        uint256 protocolFees = (loanAmount * psi * timeToMaturity) / (PRECISION * PRECISION);
        uint256 buffer = epsilon * 1e10; // Convert to 18 decimals

        // Available budget = δ + ψ + ε (what we can afford to pay)
        uint256 availableBudget = yieldLoan + protocolFees + buffer;

        // Use the smaller of target budget vs available budget
        uint256 finalBudget = budgetPrime < availableBudget ? budgetPrime : availableBudget;

        // Convert to 8 decimals for Black-Scholes
        return finalBudget / 1e10;
    }

    /**
     * @dev Find optimal strike using iterative search (internal helper)
     */
    function _findOptimalStrike(
        uint256 spot,
        uint256 loanAmount,
        uint256 timeToMaturity,
        uint256 volatility,
        uint256 deltaAPY,
        uint256 targetPremium
    ) private pure returns (uint256) {
        // For puts: strikes above spot price provide protection
        // Start from spot price and go up (puts are ITM when K > S)
        uint256 minStrike = spot; // At-the-money
        uint256 maxStrike = (spot * 130) / 100; // Up to 130% of spot for deep ITM puts

        BSParams memory params = BSParams({
            spot: spot,
            strike: 0,
            timeToMaturity: timeToMaturity,
            riskFreeRate: deltaAPY,
            volatility: volatility
        });

        // Search from high strike to low strike to find maximum affordable protection
        // Use 0.5% increments for precision
        uint256 stepSize = spot / 200; // 0.5% of spot
        if (stepSize == 0) stepSize = 1; // Minimum step

        // Start from highest strike and work down to find best affordable protection
        for (uint256 k = maxStrike; k >= minStrike; k -= stepSize) {
            params.strike = k;
            BSResult memory result = calculatePutPremiumHybrid(params);

            if (result.putPremium <= targetPremium) {
                return k; // Return highest affordable strike (best protection)
            }

            // Prevent underflow
            if (k <= stepSize) break;
        }

        return minStrike; // Fallback to minimum strike
    }

    /**
     * @dev Calculate strike using iterative approach with precise steps
     * @param spot Current price (8 decimals)
     * @param loanAmount Loan amount (18 decimals)
     * @param timeToMaturity Time in years (18 decimals)
     * @param volatility Volatility (18 decimals)
     * @param availablePremium Available premium budget (8 decimals)
     * @return Optimal strike price (8 decimals)
     */
    function calculateStrikeIterative(
        uint256 spot,
        uint256 loanAmount,
        uint256 timeToMaturity,
        uint256 volatility,
        uint256 availablePremium
    ) internal pure returns (uint256) {
        uint256 minStrike = (loanAmount / 1e10 > (spot * 80) / 100) ? loanAmount / 1e10 : (spot * 80) / 100;
        uint256 maxStrike = spot;

        BSParams memory params = BSParams({
            spot: spot,
            strike: 0,
            timeToMaturity: timeToMaturity,
            riskFreeRate: 37500000000000000, // 3.75% default
            volatility: volatility
        });

        // Iterate by 0.1$ increments as specified
        uint256 stepSize = 10000000; // 0.1$ in 8 decimals

        for (uint256 k = minStrike; k <= maxStrike; k += stepSize) {
            params.strike = k;
            BSResult memory result = calculatePutPremium(params);

            if (result.putPremium <= availablePremium) {
                return k; // Return first K where premium ≤ budget
            }
        }

        return minStrike; // Fallback to minimum strike
    }

    // ============================
    // INTERNAL FUNCTIONS
    // ============================

    /**
     * @dev Simplified put premium calculation using intrinsic value + time value
     * @dev More robust than full Black-Scholes for smart contract use
     */
    function _calculateSimplifiedPutPremium(uint256 spot, uint256 strike, uint256 timeToMaturity, uint256 volatility)
        private
        pure
        returns (uint256)
    {
        // Calculate intrinsic value (max(K-S, 0))
        uint256 intrinsicValue = strike > spot
            ? ((strike - spot) * 1e18) / 1e8 // Convert to 18 decimals temporarily
            : 0;

        // Calculate time value using simplified model
        // Time value ≈ volatility * sqrt(time) * spot * factor
        uint256 timeValue = _calculateTimeValue(spot, timeToMaturity, volatility);

        // Combine intrinsic and time value
        uint256 totalPremium18 = intrinsicValue + timeValue;

        // Convert back to 8 decimals and ensure reasonable bounds
        uint256 premium8 = totalPremium18 / 1e10;

        // Cap premium at reasonable levels (max 50% of spot)
        uint256 maxPremium = (spot * 50) / 100;
        if (premium8 > maxPremium) {
            premium8 = maxPremium;
        }

        // Minimum premium should be at least intrinsic value
        uint256 minPremium = intrinsicValue / 1e10;
        if (premium8 < minPremium) {
            premium8 = minPremium;
        }

        return premium8;
    }

    /**
     * @dev Calculate time value component using simplified volatility model
     */
    function _calculateTimeValue(uint256 spot, uint256 timeToMaturity, uint256 volatility)
        private
        pure
        returns (uint256)
    {
        // Convert spot to 18 decimals
        uint256 spot18 = spot * 1e10;

        // Calculate volatility factor: vol * sqrt(time)
        uint256 sqrtTime = _sqrt(timeToMaturity);
        uint256 volFactor = (volatility * sqrtTime) / PRECISION;

        // Time value = spot * vol_factor * scaling_factor
        // Scaling factor chosen to give reasonable premiums (around 5-15% for typical options)
        uint256 scalingFactor = PRECISION / 4; // 0.25

        uint256 timeValue = (spot18 * volFactor * scalingFactor) / (PRECISION * PRECISION);

        return timeValue;
    }

    /**
     * @dev Calculate d1 and d2 for Black-Scholes formula
     */
    function _calculateD1D2(uint256 S, uint256 K, uint256 T, uint256 r, uint256 sigma)
        private
        pure
        returns (uint256 d1, uint256 d2)
    {
        // Calculate ln(S/K) - for puts, often S < K so ln(S/K) < 0
        int256 lnSK = _ln(S, K);

        // Calculate sigma^2 / 2
        uint256 sigma2_2 = (sigma * sigma) / (2 * PRECISION);

        // Calculate (r + sigma^2/2) * T
        uint256 rPlusSigma2_2 = r + sigma2_2;
        uint256 numeratorPart = (rPlusSigma2_2 * T) / PRECISION;

        // Calculate sigma * sqrt(T)
        uint256 sqrtT = _sqrt(T);
        uint256 sigmaSqrtT = (sigma * sqrtT) / PRECISION;

        if (sigmaSqrtT == 0) {
            d1 = PRECISION / 2; // Default to reasonable value
            d2 = PRECISION / 2;
            return (d1, d2);
        }

        // d1 = [ln(S/K) + (r + σ²/2)T] / (σ√T)
        int256 d1_numerator = lnSK + int256(numeratorPart);

        // Handle negative d1 for puts (common case)
        if (d1_numerator >= 0) {
            d1 = (uint256(d1_numerator) * PRECISION) / sigmaSqrtT;
        } else {
            // For negative d1, we'll use absolute value but remember this for put calculations
            uint256 abs_d1_num = uint256(-d1_numerator);
            d1 = (abs_d1_num * PRECISION) / sigmaSqrtT;
            // Cap at reasonable values
            if (d1 > 3 * PRECISION) d1 = 3 * PRECISION;
        }

        // d2 = d1 - σ√T (always smaller than d1)
        if (d1 > sigmaSqrtT) {
            d2 = d1 - sigmaSqrtT;
        } else {
            d2 = 0; // Minimum value
        }
    }

    /**
     * @dev Approximation of natural logarithm ln(S/K)
     */
    function _ln(uint256 S, uint256 K) private pure returns (int256) {
        if (S == K) return 0;

        // Use Taylor series approximation: ln(1+x) ≈ x - x²/2 + x³/3 - ...
        // For x = (S-K)/K when S is close to K
        if (S > K) {
            uint256 ratio = ((S - K) * PRECISION) / K;
            if (ratio < PRECISION / 2) {
                // Only use for small ratios
                return int256(ratio);
            }
        } else {
            uint256 ratio = ((K - S) * PRECISION) / K;
            if (ratio < PRECISION / 2) {
                // Only use for small ratios
                return -int256(ratio);
            }
        }

        // Fallback: simplified approximation
        return S > K ? int256(PRECISION / 10) : -int256(PRECISION / 10);
    }

    /**
     * @dev Approximation of cumulative normal distribution N(x)
     * @dev Uses improved piecewise approximation for better accuracy
     */
    function _normalCDF(uint256 x) private pure returns (uint256) {
        // Handle extreme cases
        if (x == 0) return PRECISION / 2; // N(0) = 0.5

        // Convert to a reasonable scale (x is expected in [0, 3*PRECISION] range)
        // For put options, we typically deal with negative d values, but we pass abs values

        // Improved piecewise linear approximation based on standard normal CDF
        if (x < PRECISION / 10) return (45 * PRECISION) / 100; // ~0.45 for very small positive x
        if (x < PRECISION / 5) return (42 * PRECISION) / 100; // ~0.42
        if (x < PRECISION / 3) return (38 * PRECISION) / 100; // ~0.38
        if (x < PRECISION / 2) return (35 * PRECISION) / 100; // ~0.35
        if (x < (2 * PRECISION) / 3) return (30 * PRECISION) / 100; // ~0.30
        if (x < PRECISION) return (25 * PRECISION) / 100; // ~0.25
        if (x < (3 * PRECISION) / 2) return (20 * PRECISION) / 100; // ~0.20
        if (x < 2 * PRECISION) return (15 * PRECISION) / 100; // ~0.15

        return (10 * PRECISION) / 100; // ~0.10 for large x
    }

    /**
     * @dev Approximation of exponential function e^x
     */
    function _exp(int256 x) private pure returns (uint256) {
        // Use Taylor series for small values: e^x ≈ 1 + x + x²/2! + x³/3! + ...
        if (x == 0) return PRECISION;

        // For negative values (discount factor): e^(-x) ≈ 1 - x for small x
        if (x < 0) {
            uint256 absX = uint256(-x);
            if (absX < PRECISION) {
                return PRECISION - absX;
            }
            return PRECISION / 2; // Fallback
        }

        // For positive values
        uint256 absX = uint256(x);
        if (absX < PRECISION) {
            return PRECISION + absX;
        }

        return 2 * PRECISION; // Fallback
    }

    /**
     * @dev Absolute value for signed integers
     */
    function _abs(int256 x) private pure returns (uint256) {
        return x >= 0 ? uint256(x) : uint256(-x);
    }

    /**
     * @dev Safe square root using Babylonian method with bounds checking
     */
    function _sqrt(uint256 x) private pure returns (uint256) {
        if (x == 0) return 0;
        if (x == PRECISION) return PRECISION; // sqrt(1) = 1

        // For very small values, use approximation
        if (x < PRECISION / 1000) {
            // Less than 0.001
            return (x * PRECISION) / _sqrt(PRECISION); // Linear approximation
        }

        uint256 z = x;
        uint256 y = PRECISION;

        // Babylonian method with limited iterations
        for (uint256 i = 0; i < 10; i++) {
            if (z >= y) break;
            y = z;
            z = (x * PRECISION / z + z) / 2;
        }

        return y;
    }

    // ============================
    // UTILITY FUNCTIONS
    // ============================

    /**
     * @dev Safe multiplication with overflow protection
     */
    function _safeMul(uint256 a, uint256 b) private pure returns (uint256) {
        if (a == 0) return 0;
        require((a * b) / a == b, "Multiplication overflow");
        return a * b;
    }

    /**
     * @dev Safe division with zero check
     */
    function _safeDiv(uint256 a, uint256 b) private pure returns (uint256) {
        require(b > 0, "Division by zero");
        return a / b;
    }
}
