#!/usr/bin/env node

/**
 * 🔥 REAL MARKET DATA ALERTS - NO BULLSHIT
 * Uses verified market data from CoinGecko/Alternative.me
 * Every alert backed by real data with links
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6470474178';

const CACHE_FILE = path.join(__dirname, '.alerts-sent.json');
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

async function sendAlert(title, body, link, emoji = '📊') {
  try {
    const message = `${emoji} <b>${title}</b>\n\n${body}\n\n<a href="${link}">🔗 View on market data</a>`;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      },
      { timeout: 10000 }
    );

    console.log(`✅ SENT: ${title.substring(0, 60)}`);
    return true;
  } catch (e) {
    console.error('❌ Send failed:', e.message);
    return false;
  }
}

async function checkCryptoPrices() {
  try {
    console.log('💰 Checking real crypto prices...');

    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h%2C24h%2C7d',
      { timeout: 10000 }
    );

    const coins = response.data;

    for (const coin of coins.slice(0, 20)) {
      const change24h = coin.price_change_percentage_24h;

      // Alert if >5% move
      if (Math.abs(change24h) > 5) {
        const cacheKey = `${coin.id}_${new Date().toDateString()}`;

        if (!alertsSent.prices[cacheKey]) {
          alertsSent.prices[cacheKey] = true;

          const emoji = change24h > 0 ? '📈' : '📉';
          const marketCap = coin.market_cap ? `\n<b>Market Cap:</b> $${(coin.market_cap / 1e9).toFixed(2)}B` : '';

          await sendAlert(
            `${emoji} ${coin.name}: ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`,
            `<b>Price:</b> $${coin.current_price?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || 'N/A'}
<b>24h Change:</b> ${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%
<b>7d Change:</b> ${coin.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}%${marketCap}`,
            `https://www.coingecko.com/en/coins/${coin.id}`,
            emoji
          );

          await new Promise(r => setTimeout(r, 500));
        }
      }
    }
  } catch (error) {
    console.error('❌ Price check failed:', error.message);
  }
}

async function checkFearGreed() {
  try {
    console.log('😨 Checking Fear & Greed Index...');

    const response = await axios.get('https://api.alternative.me/fng/', { timeout: 10000 });
    const data = response.data.data?.[0];

    if (!data) return;

    const value = parseInt(data.value);
    const cacheKey = `fng_${new Date().toDateString()}`;

    // Alert on extremes
    if ((value < 25 || value > 75) && !alertsSent.indices[cacheKey]) {
      alertsSent.indices[cacheKey] = true;

      const emoji = value < 50 ? '😨' : '🤑';
      const signal = value < 25 ? 'EXTREME FEAR - historically leads to rallies' : value > 75 ? 'EXTREME GREED - caution advised' : 'Neutral';

      await sendAlert(
        `Fear & Greed Index: ${value}/100`,
        `<b>Sentiment:</b> ${data.value_classification}
<b>Signal:</b> ${signal}
<b>Historical:</b> ${value < 25 ? 'Past extreme fear often marked bottoms' : 'Extreme greed preceded major corrections'}`,
        'https://alternative.me/crypto/fear-and-greed-index/',
        emoji
      );
    }
  } catch (error) {
    console.error('❌ Fear/Greed failed:', error.message);
  }
}

async function checkTrendingCoins() {
  try {
    console.log('🔥 Checking trending coins...');

    const response = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 10000 });
    const trending = response.data.coins || [];

    if (trending.length > 0) {
      const top5 = trending.slice(0, 5);
      const list = top5
        .map((c, i) => `${i + 1}. <a href="https://www.coingecko.com/en/coins/${c.item.id}">${c.item.name}</a> (${c.item.symbol.toUpperCase()})`)
        .join('\n');

      const cacheKey = `trending_${new Date().toDateString()}`;

      if (!alertsSent.indices[cacheKey]) {
        alertsSent.indices[cacheKey] = true;

        await sendAlert(
          '🔥 Top 5 Trending Coins Right Now',
          `Market attention shifting to:\n\n${list}\n\nThese coins gaining real volume and interest.`,
          'https://www.coingecko.com/en/',
          '🔥'
        );
      }
    }
  } catch (error) {
    console.error('❌ Trending failed:', error.message);
  }
}

async function checkVolumeSpikes() {
  try {
    console.log('📊 Checking volume spikes...');

    const response = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&sparkline=false',
      { timeout: 10000 }
    );

    const highVolume = response.data[0];

    if (highVolume) {
      const volume24h = highVolume.total_volume || 0;

      if (volume24h > 50e9) {
        const cacheKey = `volume_${new Date().toDateString()}`;

        if (!alertsSent.indices[cacheKey]) {
          alertsSent.indices[cacheKey] = true;

          await sendAlert(
            `📊 Massive Trading Volume Alert`,
            `<b>Top Volume Coin:</b> ${highVolume.name}
<b>24h Volume:</b> $${(volume24h / 1e9).toFixed(2)}B
<b>Price:</b> $${highVolume.current_price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
<b>Signal:</b> Extreme liquidity and institutional interest`,
            `https://www.coingecko.com/en/coins/${highVolume.id}`,
            '📊'
          );
        }
      }
    }
  } catch (error) {
    console.error('❌ Volume check failed:', error.message);
  }
}

async function runMonitor() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Market scan...`);

  loadCache();

  try {
    await checkCryptoPrices();
    await new Promise(r => setTimeout(r, 1000));

    await checkFearGreed();
    await new Promise(r => setTimeout(r, 1000));

    await checkTrendingCoins();
    await new Promise(r => setTimeout(r, 1000));

    await checkVolumeSpikes();
  } catch (error) {
    console.error('Monitor error:', error.message);
  }

  saveCache();
  console.log('✅ Scan complete\n');
}

// Run now
runMonitor();

// Every 5 minutes
setInterval(runMonitor, 300000);

console.log('✅ REAL MARKET DATA MONITOR ACTIVE');
console.log('Alerts backed by real CoinGecko data with links');
console.log('Updates every 5 minutes\n');

process.on('uncaughtException', (error) => {
  console.error('Crash:', error.message);
  setTimeout(() => runMonitor(), 5000);
});
