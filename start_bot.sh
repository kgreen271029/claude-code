#!/bin/bash

# Telegram Stock Bot Startup Script
# This script starts the bot in the background with proper logging

set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please create .env file from .env.example:"
    echo "  cp .env.example .env"
    echo "  # Edit .env with your credentials"
    exit 1
fi

# Load environment variables from .env
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$TELEGRAM_CHAT_ID" ]; then
    echo "Error: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env"
    exit 1
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Start the bot in background
echo "Starting Telegram Stock Bot..."
echo "Monitoring stocks: $STOCKS_TO_MONITOR"
echo "Scan interval: ${SCAN_INTERVAL_SECONDS}s"
echo "Logs: logs/telegram_stock_bot.log"
echo ""

nohup python3 telegram_stock_bot.py > logs/telegram_stock_bot.log 2>&1 &
BOT_PID=$!

echo "Bot started with PID: $BOT_PID"
echo "Bot is running in the background."
echo ""
echo "To view logs: tail -f logs/telegram_stock_bot.log"
echo "To stop the bot: kill $BOT_PID"

# Save PID to file for easy stopping
echo $BOT_PID > .bot_pid

echo "$BOT_PID" > .bot_pid
