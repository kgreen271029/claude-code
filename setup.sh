#!/bin/bash

echo "🚀 Content Repurposer - Setup Script"
echo "===================================="
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo "✓ Node.js is installed: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo "✓ Server dependencies installed"
echo ""

echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

echo "✓ Client dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env with your API keys:"
    echo "   1. CLAUDE_API_KEY from https://console.anthropic.com"
    echo "   2. STRIPE_SECRET_KEY from https://dashboard.stripe.com"
    echo "   3. JWT_SECRET (run: openssl rand -base64 32)"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Edit .env with your API keys"
echo "   2. Run: npm run dev"
echo "   3. Open http://localhost:3000"
echo ""
echo "📖 Read LAUNCH_CHECKLIST.md for full deployment guide"
