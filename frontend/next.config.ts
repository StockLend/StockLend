import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Disable ESLint during build for faster deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: [
            "lucide-react",
            "@radix-ui/react-dropdown-menu",
        ],
    },

    // Configure for Web3 compatibility
    webpack: (config) => {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        // Handle ESM modules
        config.externals.push("pino-pretty", "lokijs", "encoding");

        return config;
    },

    // Enable static exports for better performance
    output: "standalone",

    // Configure headers for Web3 security
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Frame-Options",
                        value: "DENY",
                    },
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
        ];
    },

    // Enable image optimization
    images: {
        domains: ["localhost"],
        formats: ["image/webp", "image/avif"],
    },

    // Configure environment variables
    env: {
        NEXT_PUBLIC_ENVIRONMENT:
            process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
    },
};

export default nextConfig;
