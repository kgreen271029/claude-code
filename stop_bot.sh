#!/bin/bash

# Telegram Stock Bot Stop Script

if [ -f .bot_pid ]; then
    PID=$(cat .bot_pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping bot (PID: $PID)..."
        kill $PID
        rm .bot_pid
        echo "Bot stopped."
    else
        echo "Bot is not running."
        rm .bot_pid
    fi
else
    echo "Bot PID file not found. Searching for running instances..."
    pkill -f "python3 telegram_stock_bot.py" && echo "Bot stopped." || echo "No running bot found."
fi
