# 📊 Real-Time Market Monitor Setup Guide

## Overview
Your personal market monitoring system is ready to send you constant alerts about stocks, indices, options, earnings, and macroeconomic events throughout the trading day.

**What you'll get:**
- 🚀 Stock price alerts when moves exceed 1.5%
- 📊 Index updates (S&P 500, NASDAQ, Russell 2000)
- 🎯 Unusual options activity detection
- 🎉 Earnings surprises and beats
- 🔄 Sector rotation alerts
- 🔥 Breaking Fed & macro news
- 💰 Commodity price movements
- ⚡ Real-time market sentiment

## Quick Start

### Option 1: Run Locally (Easiest)

```bash
# Clone/navigate to the repo
cd ~/claude-code

# Run the setup (only first time)
bash start-monitor.sh

# Or just start directly
npm start
```

The monitor will:
- Run continuously during market hours (9:30 AM - 4:00 PM ET)
- Send alerts to your Telegram every 5-15 minutes
- Keep running until you press `Ctrl+C`

**To run 24/7 on your Mac/Linux:**
1. Use a process manager like `pm2`:
   ```bash
   npm install -g pm2
   pm2 start market-monitor-realtime.js --name "market-monitor"
   pm2 save
   pm2 startup
   ```

2. Or use a cron job:
   ```bash
   # Add to crontab (crontab -e):
   # Run every 5 minutes during market hours
   */5 9-16 * * 1-5 cd ~/claude-code && npm start >> monitor.log 2>&1
   ```

### Option 2: GitHub Actions (Recommended - Runs in Cloud)

The system is already configured to run on GitHub Actions!

**Setup:**
1. Go to your GitHub repo settings: `Settings > Secrets and variables > Actions`
2. Add these secrets:
   - `TELEGRAM_BOT_TOKEN`: `8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s`
   - `TELEGRAM_CHAT_ID`: `6470474178`

3. The workflow will automatically:
   - Run every 5 minutes during market hours
   - Send alerts directly to your Telegram
   - No need to keep your computer on!

### Option 3: Cloud Deployment (24/7)

Deploy to free services:
- **Railway**: https://railway.app (free tier, up to 5GB)
- **Render**: https://render.com (free tier, auto-scales)
- **Replit**: https://replit.com (free tier, always on)
- **AWS Lambda**: Free tier (AWS free account)

Each service:
1. Connect your GitHub repo
2. Set environment variables (bot token, chat ID)
3. Deploy - monitor runs 24/7!

## Configuration

### .env File
The system uses a `.env` file for configuration:

```bash
# Copy example to actual config
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Settings:**
```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=6470474178
CHECK_INTERVAL_MINUTES=5
PRICE_ALERT_THRESHOLD=1.5
```

### Market Hours
By default, the monitor only alerts during official market hours:
- **Hours**: 9:30 AM - 4:00 PM ET
- **Days**: Monday - Friday

Edit `market-monitor-realtime.js` to change:
```javascript
const CHECK_INTERVAL = 5 * 60 * 1000; // Every 5 minutes
```

## What Each Alert Shows

### Stock Price Alert
```
🚀 HUGE MOVE ALERT! 🚀

NVIDIA (NVDA) 📈
Price: $127.45
Change: +2.34% (+$2.87)
Volume: 45.2M shares
Time: 10:35 AM ET

Reason: AI chip demand surge
```

### Index Update
```
📊 MARKET INDEX UPDATE 📊

S&P 500 (SPY) ↗️
+0.63% (+$3.45)
Current: $549.23
```

### Options Activity
```
🎯 UNUSUAL OPTIONS ACTIVITY 🎯

TESLA (TSLA) - Big bet detected
50K call contracts bought @ $250
3.2x average volume
```

### Earnings Report
```
🎉 EARNINGS BEAT! 🎉

AMAZON (AMZN) 📈
EPS: $1.89 vs expected $1.58 ✅
```

## Monitoring Stocks

The system watches these by default:
```
NVDA, TESLA, APPLE, AMZN, META, GOOGL,
MSFT, SPY, QQQ, IWM, GLD, BTC-USD
```

**To add more stocks:**
Edit `market-monitor-realtime.js`:
```javascript
const WATCHLIST = [
  'NVDA', 'TESLA', 'APPLE',  // Add your stocks here
  'YOUR_TICKER_HERE',
];
```

## Alert Types

| Alert | Trigger | Frequency |
|-------|---------|-----------|
| Price Move | >1.5% change | Real-time |
| Volume Spike | >1.5x average volume | Real-time |
| Earnings | EPS surprises | When announced |
| Options | Unusual activity | 5-15 min |
| Sector | Rotation patterns | 15 min |
| Fed/Macro | Breaking news | Immediately |
| Commodities | Gold, Oil, Crypto moves | 15 min |

## Troubleshooting

### Not receiving alerts?
1. Check Telegram bot token is correct
2. Make sure chat ID is right: `/start @userinfobot`
3. Check network connection
4. View logs: `npm start` shows activity

### Too many alerts?
- Increase `PRICE_ALERT_THRESHOLD` in `.env`
- Reduce `WATCHLIST` in the script
- Adjust `CHECK_INTERVAL_MINUTES`

### Monitor stops running?
- Increase timeout if using cloud (GitHub Actions has 6-hour limit)
- Use PM2 to auto-restart on crashes
- Check error logs for API issues

## API Keys (Optional)

For enhanced features, add free API keys:

1. **Finnhub** (Stock data): https://finnhub.io
   - Free tier: 60 API calls/minute
   - Add to `.env`: `FINNHUB_API_KEY=xxx`

2. **NewsAPI** (Financial news): https://newsapi.org
   - Free tier: 100 requests/day
   - Add to `.env`: `NEWS_API_KEY=xxx`

3. **Alpha Vantage** (Technical analysis): https://alphavantage.co
   - Free tier: 5 requests/minute
   - Add to `.env`: `ALPHA_VANTAGE_KEY=xxx`

## Monitoring Logs

See what alerts are being sent:

```bash
# Run and watch output
npm start

# Save logs to file
npm start >> market-monitor.log 2>&1

# Watch logs in real-time
tail -f market-monitor.log
```

## Cost

**Completely Free!**
- Telegram bot: $0
- GitHub Actions: $0 (free tier includes market monitoring)
- Data APIs: Free tiers available
- Cloud deployment: Usually free tier works

## Support

If the monitor isn't working:
1. Check `.env` file exists and has correct token/chat ID
2. Test Telegram bot is active: Send message to @Trading_news_bot_69_bot
3. Check network connection
4. View logs for error messages

## Next Steps

1. ✅ Verify Telegram bot is working
2. ✅ Run `npm start` to test locally
3. ✅ Set up GitHub Actions secrets for cloud deployment
4. ✅ Add API keys to `.env` for enhanced features
5. ✅ Customize watchlist for your stocks
6. ✅ Set up persistent deployment (PM2 or cloud)

---

**Happy trading! You're all set to monitor the market like a pro.** 📊🚀
