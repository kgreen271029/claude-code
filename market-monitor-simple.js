#!/usr/bin/env node

/**
 * 🔥 SIMPLE NEWS SCANNER - SENDS REAL ALERTS EVERY 5 MIN
 * No filtering. Every important news = alert to Telegram.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '6470474178';

const STATE_FILE = path.join(__dirname, '.news-cache.json');
let lastSent = [];

function getCache() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveCache(data) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(data.slice(0, 200))); // Keep last 200
  } catch (e) {}
}

async function sendAlert(title, body) {
  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: `📰 <b>${title}</b>\n\n${body}`,
        parse_mode: 'HTML'
      },
      { timeout: 10000 }
    );
    console.log(`✅ Sent: ${title.substring(0, 50)}`);
    return true;
  } catch (e) {
    console.error('❌ Send failed:', e.message);
    return false;
  }
}

async function scanNews() {
  console.log(`\n[${new Date().toLocaleTimeString()}] 🔍 Scanning news...`);

  lastSent = getCache();
  let foundAlerts = 0;

  // Use public RSS feeds (always free, no rate limits)
  const feeds = [
    // CNBC Markets RSS
    'https://feeds.cnbc.com/id/100003114/1d/feed.rss',
    // MarketWatch Stock market
    'http://feeds.marketwatch.com/marketwatch/topstories/',
    // Yahoo Finance crypto
    'https://feeds.finance.yahoo.com/rss/2.0/headline'
  ];

  for (const feedUrl of feeds) {
    try {
      const res = await axios.get(feedUrl, { timeout: 5000 });
      const xml = res.data;

      // Simple regex parsing for RSS
      const itemRegex = /<item>[\s\S]*?<\/item>/g;
      const items = xml.match(itemRegex) || [];

      for (const itemXml of items.slice(0, 5)) {
        // Extract title
        const titleMatch = itemXml.match(/<title[^>]*>([^<]+)<\/title>/);
        const headline = titleMatch ? titleMatch[1] : '';

        // Extract description
        const descMatch = itemXml.match(/<description[^>]*>([^<]+)<\/description>/);
        const desc = descMatch ? descMatch[1].substring(0, 150) : '';

        // Extract link
        const linkMatch = itemXml.match(/<link[^>]*>([^<]+)<\/link>/);
        const url = linkMatch ? linkMatch[1] : '';

        if (!headline) continue;

        // Check if we already sent this
        const itemKey = headline.substring(0, 50);
        if (lastSent.includes(itemKey)) continue;

        // Send alert for any important-sounding news
        const importantKeywords = ['surge', 'crash', 'soar', 'plunge', 'beat', 'miss', 'earnings', 'merger', 'ipo', 'bankruptcy', 'rate', 'fed', 'inflation', 'market', 'stock', 'crypto', 'bitcoin'];
        const isImportant = importantKeywords.some(kw => headline.toLowerCase().includes(kw));

        if (isImportant) {
          await sendAlert(
            headline.substring(0, 70),
            `${desc}

${url ? `<a href="${url}">Read more →</a>` : ''}`
          );
          foundAlerts++;
          lastSent.push(itemKey);
          await new Promise(r => setTimeout(r, 300));
        }
      }
    } catch (e) {
      console.log(`⚠️ Feed failed: ${e.message}`);
    }
  }

  if (foundAlerts === 0) {
    console.log('ℹ️ No important news right now');
  } else {
    console.log(`✅ Found ${foundAlerts} alerts`);
  }

  saveCache(lastSent);
}

// Run immediately
scanNews();

// Then every 5 minutes
setInterval(scanNews, 300000);

console.log('🔥 NEWS SCANNER ACTIVE - Checking every 5 minutes');
console.log('Sending alerts for: earnings, price moves, mergers, economic news');
