const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = '6470474178';
const API_BASE = 'https://api.telegram.org/bot';

async function sendMessage(text) {
  try {
    const response = await axios.post(
      `${API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }
    );
    console.log('✅ Message sent!');
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data?.description || error.message);
  }
}

async function sendSamples() {
  // Example 1: Stock Alert
  const alert1 = `
🚀 <b>HUGE MOVE ALERT!</b> 🚀

<b>NVIDIA (NVDA)</b> 📈
Price: $127.45
Change: <b>+2.34%</b> (+$2.87)
Volume: 45.2M shares
Time: 3:53 PM ET

<b>Reason:</b> AI chip demand surges after latest earnings beat
Analyst upgrade from Goldman Sachs

<a href="https://finance.yahoo.com/quote/NVDA">📰 Read full article →</a>

<i>Action: Institutional buyers accumulating</i>
  `;

  console.log('\n📨 Sending Example Alert #1: Stock Price Move\n');
  await sendMessage(alert1);
  await new Promise(r => setTimeout(r, 2000));

  // Example 2: Index Update
  const alert2 = `
📊 <b>MARKET INDEX UPDATE</b> 📊

<b>S&P 500 (SPY)</b> ↗️
+0.63% (+$3.45)
Current: $549.23

<b>NASDAQ (QQQ)</b> ↗️
+1.33% (+$5.67)
Current: $432.11

<b>Russell 2000 (IWM)</b> ↘️
-1.17% (-$2.34)
Current: $198.45

⚖️ <b>Market sentiment:</b> Tech-heavy rally continues

<a href="https://example.com/market">📊 Full market report →</a>
  `;

  console.log('📨 Sending Example Alert #2: Index Update\n');
  await sendMessage(alert2);
  await new Promise(r => setTimeout(r, 2000));

  // Example 3: Earnings
  const alert3 = `
🎉 <b>EARNINGS BEAT!</b> 🎉

<b>AMAZON (AMZN)</b> 📈
Price: $193.25
Change: <b>+2.48%</b> (+$4.67)

<b>Q2 Earnings Report:</b>
• Revenue: $148B (+9% YoY) ✅
• EPS: <b>$1.89</b> vs expected $1.58
• AWS revenue: $27.3B (+20%)

<b>Forward Guidance:</b> Raised Q3 outlook

<a href="https://finance.yahoo.com/quote/AMZN">💡 Full earnings analysis →</a>

📈 <i>Analysts upgrading price targets</i>
  `;

  console.log('📨 Sending Example Alert #3: Earnings Surprise\n');
  await sendMessage(alert3);
  await new Promise(r => setTimeout(r, 2000));

  // Example 4: Options Activity
  const alert4 = `
🎯 <b>UNUSUAL OPTIONS ACTIVITY DETECTED</b> 🎯

<b>TESLA (TSLA)</b> - Big institutional bet
Price: $245.67
📉 Currently -1.25% on the day

<b>Options Flow Alert:</b>
• 50K call contracts bought @ $250 strike
• Expires in 14 days
• <b>3.2x average volume</b>

<b>Analysis:</b> Bullish bet despite red day = Strong institutional confidence

<a href="https://example.com/tsla-options">🎯 View options chain →</a>

⚡ <i>High implied volatility environment</i>
  `;

  console.log('📨 Sending Example Alert #4: Options Activity\n');
  await sendMessage(alert4);
  await new Promise(r => setTimeout(r, 2000));

  console.log('\n✅ All example alerts sent to your Telegram!\n');
  console.log('This is what you\'ll get throughout the day during market hours.');
}

sendSamples();
