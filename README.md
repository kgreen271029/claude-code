# Telegram Stock Update Bot

A continuous stock market monitoring bot that sends real-time updates via Telegram.

## Features

- **Always Running**: Continuously monitors stock prices 24/7
- **Real-time Updates**: Sends Telegram messages with current stock prices and changes
- **Error Resilient**: Auto-recovers from network failures
- **Configurable**: Easy setup with environment variables
- **Multiple Stocks**: Monitor multiple stocks simultaneously
- **Formatted Output**: Clean, readable message format with emojis

## Setup

### Prerequisites
- Python 3.8+
- Telegram Bot Token (from BotFather)
- Your Telegram Chat ID

### Installation

1. **Clone and navigate to the project**
   ```bash
   cd /home/user/claude-code
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   export TELEGRAM_BOT_TOKEN="your_bot_token_here"
   export TELEGRAM_CHAT_ID="your_chat_id_here"
   export STOCKS_TO_MONITOR="AAPL,GOOGL,MSFT,AMZN,NVDA"
   export SCAN_INTERVAL_SECONDS="300"
   ```

### Running the Bot

#### Option 1: Direct Python (Development)
```bash
python3 telegram_stock_bot.py
```

#### Option 2: As a Background Service (Production)

1. **Update the service file with your credentials**
   ```bash
   sudo nano /home/user/claude-code/telegram-stock-bot.service
   ```
   Replace `YOUR_BOT_TOKEN` and `YOUR_CHAT_ID` with your actual values.

2. **Install the service**
   ```bash
   sudo cp telegram-stock-bot.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable telegram-stock-bot
   sudo systemctl start telegram-stock-bot
   ```

3. **Check status**
   ```bash
   sudo systemctl status telegram-stock-bot
   ```

4. **View logs**
   ```bash
   sudo tail -f /var/log/telegram-stock-bot.log
   ```

#### Option 3: Using nohup (Simple Background)
```bash
nohup python3 telegram_stock_bot.py > stock_bot.log 2>&1 &
```

## Configuration

- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `TELEGRAM_CHAT_ID`: Your Telegram chat ID (where updates are sent)
- `STOCKS_TO_MONITOR`: Comma-separated list of stock tickers (default: AAPL,GOOGL,MSFT)
- `SCAN_INTERVAL_SECONDS`: How often to scan the market (default: 300 = 5 minutes)

## Getting Your Telegram Credentials

### Bot Token
1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Follow the instructions to create a bot
4. Copy the API token

### Chat ID
1. Send a message to your bot
2. Open your browser and go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for the `"chat":{"id"` field - that's your Chat ID

## Logs

- **Console**: Real-time output when running directly
- **File**: `stock_bot.log` in the project directory
- **Systemd**: `/var/log/telegram-stock-bot.log` when running as a service

## Troubleshooting

### Bot doesn't send messages
- Check that `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correct
- Verify the bot is still running: `ps aux | grep telegram_stock_bot`
- Check logs for errors

### Bot stops after a few minutes
- Run as a systemd service (it will auto-restart)
- Or use nohup to keep it running in background
- Check logs for network or API errors

### High API errors
- Increase `SCAN_INTERVAL_SECONDS` to avoid rate limiting
- Check your internet connection
- Verify yfinance service is accessible

## Support

The bot includes comprehensive logging. All errors are logged to both console and file for debugging.