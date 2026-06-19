#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6470474178';

const CACHE_FILE = path.join('/tmp', '.alerts-sent.json');
let alertsSent = { prices: {}, indices: {} };

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      alertsSent = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {}
}

function saveCache() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(alertsSent));
  } catch (e) {}
}

async function sendAlert(title, body, link, emoji) {
  try {
    const message = `${emoji} <b>${title}</b>\n\n${body}\n\n<a href="${link}">🔗 Full story</a>`;
    const res = await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      { chat_id: TELEGRAM_CHAT_ID, text: message, parse_mode: 'HTML', disable_web_page_preview: true },
      { timeout: 10000 }
    );
    console.log(`✅ SENT: ${title.substring(0, 60)}`);
    return true;
  } catch (e) {
    console.error('❌ Send failed:', e.response?.data || e.message);
    return false;
  }
}

async function checkCryptoPrices() {
  console.log('💰 Checking crypto prices...');
  const response = await axios.get(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&price_change_percentage=24h,7d',
    { timeout: 15000 }
  );
  const coins = response.data;
  let sent = 0;
  for (const coin of coins) {
    const change24h = coin.price_change_percentage_24h;
    if (!change24h) continue;
    if (Math.abs(change24h) > 5) {
      const cacheKey = `${coin.id}_${new Date().toDateString()}`;
      if (!alertsSent.prices[cacheKey]) {
        alertsSent.prices[cacheKey] = true;
        const emoji = change24h > 0 ? '📈' : '📉';
        await sendAlert(
          `${coin.name} ${change24h > 0 ? '+' : ''}${change24h.toFixed(1)}% in 24h`,
          `<b>Price:</b> $${coin.current_price?.toLocaleString()}
<b>24h:</b> ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%
<b>7d:</b> ${coin.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}%
<b>Market Cap:</b> $${(coin.market_cap / 1e9).toFixed(1)}B`,
          `https://www.coingecko.com/en/coins/${coin.id}`,
          emoji
        );
        sent++;
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  if (sent === 0) console.log('No major price moves right now');
}

async function checkFearGreed() {
  console.log('😨 Checking Fear & Greed...');
  const response = await axios.get('https://api.alternative.me/fng/', { timeout: 10000 });
  const data = response.data.data?.[0];
  if (!data) return;
  const value = parseInt(data.value);
  const cacheKey = `fng_${new Date().toDateString()}`;
  if (!alertsSent.indices[cacheKey]) {
    alertsSent.indices[cacheKey] = true;
    const emoji = value < 25 ? '😱' : value < 45 ? '😨' : value > 75 ? '🤑' : value > 55 ? '😏' : '😐';
    const signal = value < 25 ? 'EXTREME FEAR — historically a buying signal'
      : value < 45 ? 'Fear dominating — market cautious'
      : value > 75 ? 'EXTREME GREED — consider taking profits'
      : value > 55 ? 'Greed building — bulls in control'
      : 'Neutral sentiment';
    await sendAlert(
      `Fear & Greed Index: ${value}/100 — ${data.value_classification}`,
      `<b>Signal:</b> ${signal}`,
      'https://alternative.me/crypto/fear-and-greed-index/',
      emoji
    );
  }
}

async function checkTrending() {
  console.log('🔥 Checking trending...');
  const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 10000 });
  const coins = response.data.coins?.slice(0, 7) || [];
  if (!coins.length) return;
  const cacheKey = `trending_${new Date().toDateString()}_${new Date().getHours()}`;
  if (!alertsSent.indices[cacheKey]) {
    alertsSent.indices[cacheKey] = true;
    const list = coins
      .map((c, i) => `${i + 1}. <a href="https://www.coingecko.com/en/coins/${c.item.id}">${c.item.name}</a> (${c.item.symbol.toUpperCase()})`)
      .join('\n');
    await sendAlert(
      'Top Trending Coins Right Now',
      `Coins getting the most attention:\n\n${list}`,
      'https://www.coingecko.com/en/discover',
      '🔥'
    );
  }
}

async function checkGlobalMarket() {
  console.log('🌍 Checking global market...');
  const response = await axios.get('https://api.coingecko.com/api/v3/global', { timeout: 10000 });
  const data = response.data.data;
  const totalVol = data.total_volume?.usd || 0;
  const marketCap = data.total_market_cap?.usd || 0;
  const btcDom = data.btc_dominance?.toFixed(1);
  const cacheKey = `global_${new Date().toDateString()}_${new Date().getHours()}`;
  if (!alertsSent.indices[cacheKey]) {
    alertsSent.indices[cacheKey] = true;
    await sendAlert(
      'Crypto Market Snapshot',
      `<b>Total Market Cap:</b> $${(marketCap / 1e12).toFixed(2)}T
<b>24h Volume:</b> $${(totalVol / 1e9).toFixed(1)}B
<b>BTC Dominance:</b> ${btcDom}%
<b>Active Coins:</b> ${data.active_cryptocurrencies?.toLocaleString()}`,
      'https://www.coingecko.com/en/',
      '🌍'
    );
  }
}

async function runMonitor() {
  console.log(`\n[${new Date().toISOString()}] Starting monitor cycle...`);
  loadCache();
  try {
    await checkCryptoPrices();
    await new Promise(r => setTimeout(r, 1000));
    await checkFearGreed();
    await new Promise(r => setTimeout(r, 1000));
    await checkTrending();
    await new Promise(r => setTimeout(r, 1000));
    await checkGlobalMarket();
  } catch (error) {
    console.error('Monitor error:', error.message);
  }
  saveCache();
  console.log('✅ Cycle done');
}

runMonitor();
setInterval(runMonitor, 300000);

process.on('uncaughtException', (error) => {
  console.error('Crash:', error.message);
  setTimeout(() => runMonitor(), 5000);
});
