#!/bin/bash

# Market Monitor Startup Script
echo "🚀 Starting Market Monitor for Konrad..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file. Edit it with your API keys if needed."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Starting real-time market monitor..."
echo "📊 Chat ID: 6470474178"
echo "🤖 Bot Token configured"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Run the monitor
node market-monitor-realtime.js
