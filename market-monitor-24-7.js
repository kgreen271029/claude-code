#!/usr/bin/env node

/**
 * 🔥 REAL-TIME MARKET MONITOR - SENDS ALERTS EVERY 5 MINUTES
 * Uses working APIs, sends actual market data alerts constantly
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6470474178';

const STATE_FILE = path.join(__dirname, '.monitor-state.json');
let state = {
  lastPrices: {},
  lastFng: 0,
  alertCount: 0
};

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
    }
  } catch (e) {}
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (e) {}
}

async function sendAlert(title, body, emoji = '📊') {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: `${emoji} <b>${title}</b>\n\n${body}`,
        parse_mode: 'HTML'
      },
      { timeout: 10000 }
    );
    state.alertCount++;
    console.log(`✅ Alert #${state.alertCount}: ${title.substring(0, 50)}`);
    return true;
  } catch (e) {
    console.error('❌ Alert failed:', e.message);
    return false;
  }
}

async function checkCryptoPrices() {
  try {
    const coins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'dogecoin'];
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coins.join(',')}&vs_currencies=usd&include_24hr_change=true`,
      { timeout: 8000 }
    );

    const prices = response.data;

    for (const [coin, data] of Object.entries(prices)) {
      const change = data.usd_24h_change || 0;
      const price = data.usd;

      // Alert on significant moves (>3%)
      if (Math.abs(change) > 3) {
        const lastPrice = state.lastPrices[coin];

        // Only alert once per day per coin
        if (!lastPrice || new Date().toDateString() !== new Date(lastPrice.date).toDateString()) {
          const direction = change > 0 ? '📈' : '📉';
          const name = coin.charAt(0).toUpperCase() + coin.slice(1);

          await sendAlert(
            `${direction} ${name}: ${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
            `<b>Price:</b> $${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
<b>24h Change:</b> ${change > 0 ? '+' : ''}${change.toFixed(2)}%
<b>Signal:</b> ${change > 0 ? 'Bullish momentum' : 'Selling pressure'}`,
            direction
          );

          state.lastPrices[coin] = { price, change, date: new Date().toISOString() };
        }
      }
    }
  } catch (error) {
    console.error('Price check failed:', error.message);
  }
}

async function checkFearGreed() {
  try {
    const response = await axios.get('https://api.alternative.me/fng/', { timeout: 8000 });
    const data = response.data.data?.[0];

    if (!data) return;

    const value = parseInt(data.value);
    const sentiment = data.value_classification;

    // Alert on extremes
    if (value < 30 || value > 70) {
      if (Math.abs(value - state.lastFng) > 10) {
        const emoji = value < 50 ? '📉' : '📈';
        const signal = value < 30 ? 'EXTREME FEAR - Buying opportunity' : value > 70 ? 'EXTREME GREED - Take profits' : 'Fear/Greed shift';

        await sendAlert(
          `Fear & Greed Index: ${value}`,
          `<b>Sentiment:</b> ${sentiment}
<b>Signal:</b> ${signal}
<b>Index:</b> ${value}/100

Market psychology: ${value < 50 ? 'Fearful' : 'Greedy'}`,
          emoji
        );

        state.lastFng = value;
      }
    }
  } catch (error) {
    console.error('Fear/Greed check failed:', error.message);
  }
}

async function checkTrending() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 8000 });
    const trending = response.data.coins?.slice(0, 5) || [];

    if (trending.length > 0) {
      const list = trending
        .map((c, i) => `${i + 1}. <b>${c.item.name}</b> (${c.item.symbol.toUpperCase()})`)
        .join('\n');

      await sendAlert(
        '🔥 Top Trending Coins',
        `Market favorites gaining attention:\n\n${list}`,
        '🔥'
      );
    }
  } catch (error) {
    console.error('Trending check failed:', error.message);
  }
}

async function runMonitor() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Market check...`);

  loadState();

  try {
    await checkCryptoPrices();
    await new Promise(r => setTimeout(r, 500));

    await checkFearGreed();
    await new Promise(r => setTimeout(r, 500));

    await checkTrending();
  } catch (error) {
    console.error('Monitor error:', error.message);
  }

  saveState();
}

// Run immediately
runMonitor();

// Then every 5 minutes
setInterval(runMonitor, 300000);

console.log('✅ MARKET MONITOR ACTIVE');
console.log('Checking every 5 minutes for:');
console.log('- Crypto price moves (>3%)');
console.log('- Fear & Greed extremes');
console.log('- Trending coins\n');
console.log('Alerts go to Telegram chat: 6470474178');

process.on('uncaughtException', (error) => {
  console.error('Crash:', error.message);
  setTimeout(() => runMonitor(), 5000);
});
