import asyncio
import logging
import os
from datetime import datetime
import yfinance as yf
from telegram import Bot
from telegram.error import TelegramError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('stock_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TelegramStockBot:
    def __init__(self):
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.stocks = os.getenv('STOCKS_TO_MONITOR', 'AAPL,GOOGL,MSFT').split(',')
        self.scan_interval = int(os.getenv('SCAN_INTERVAL_SECONDS', '300'))  # 5 minutes
        self.bot = Bot(token=self.bot_token)

        if not self.bot_token or not self.chat_id:
            raise ValueError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables are required")

        logger.info(f"Bot initialized. Monitoring: {self.stocks}, Scan interval: {self.scan_interval}s")

    async def get_stock_data(self, ticker):
        """Fetch current stock data"""
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period='1d')
            if hist.empty:
                return None

            current_price = hist['Close'].iloc[-1]
            open_price = hist['Open'].iloc[-1]
            change = current_price - open_price
            change_percent = (change / open_price * 100) if open_price != 0 else 0

            return {
                'ticker': ticker,
                'price': current_price,
                'change': change,
                'change_percent': change_percent,
                'timestamp': datetime.now()
            }
        except Exception as e:
            logger.error(f"Error fetching data for {ticker}: {e}")
            return None

    async def send_update(self, stock_data):
        """Send stock update to Telegram"""
        if not stock_data:
            return False

        try:
            emoji = "📈" if stock_data['change'] >= 0 else "📉"
            message = (
                f"{emoji} *{stock_data['ticker']}* Update\n"
                f"Price: ${stock_data['price']:.2f}\n"
                f"Change: ${stock_data['change']:+.2f} ({stock_data['change_percent']:+.2f}%)\n"
                f"Time: {stock_data['timestamp'].strftime('%Y-%m-%d %H:%M:%S')}"
            )

            await self.bot.send_message(
                chat_id=self.chat_id,
                text=message,
                parse_mode='Markdown'
            )
            logger.info(f"Sent update for {stock_data['ticker']}")
            return True
        except TelegramError as e:
            logger.error(f"Telegram error sending update: {e}")
            return False
        except Exception as e:
            logger.error(f"Error sending update: {e}")
            return False

    async def scan_market(self):
        """Scan market and send updates for all monitored stocks"""
        logger.info(f"Starting market scan for {len(self.stocks)} stocks")

        for ticker in self.stocks:
            ticker = ticker.strip()
            try:
                stock_data = await self.get_stock_data(ticker)
                if stock_data:
                    await self.send_update(stock_data)
                await asyncio.sleep(1)  # Rate limiting between requests
            except Exception as e:
                logger.error(f"Error processing {ticker}: {e}")
                continue

    async def run_forever(self):
        """Run the bot continuously, scanning the market at regular intervals"""
        logger.info("Bot started - will scan market every {} seconds".format(self.scan_interval))

        while True:
            try:
                await self.scan_market()
                logger.info(f"Scan complete. Sleeping for {self.scan_interval} seconds...")
                await asyncio.sleep(self.scan_interval)
            except KeyboardInterrupt:
                logger.info("Bot interrupted by user")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                logger.info(f"Retrying in 30 seconds...")
                await asyncio.sleep(30)  # Wait before retrying on error

async def main():
    """Main entry point"""
    try:
        bot = TelegramStockBot()
        await bot.run_forever()
    except Exception as e:
        logger.critical(f"Failed to start bot: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())
