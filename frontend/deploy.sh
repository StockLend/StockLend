#!/bin/bash

# StockLend Frontend Deployment Script
echo "🚀 Deploying StockLend Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🎉 Your StockLend app is now live on Vercel!"
echo ""
echo "📝 Don't forget to set up environment variables in Vercel dashboard:"
echo "   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID"
echo "   - NEXT_PUBLIC_ALCHEMY_ID"
echo "   - NEXT_PUBLIC_ENVIRONMENT=production"
echo ""
echo "🔗 Visit your Vercel dashboard to get the live URL" 