#!/usr/bin/env node

/**
 * COMPREHENSIVE 24/7 MARKET MONITOR
 * Covers everything that moves markets:
 * - Crypto prices & trending
 * - Stock market news (RSS)
 * - Reddit sentiment (WSB, stocks, crypto)
 * - SEC insider trading (EDGAR)
 * - US Treasury yields
 * - Fear & Greed index
 * - Breaking financial news (RSS)
 * - New crypto listings
 * - Global market snapshot
 */

const axios = require('axios');
const https = require('https');
const fs = require('fs');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8676839503:AAH3wz-_zwO6IHaXoPuxL5u0MaDZ0Zi_Z7s';
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID   || '6470474178';

const CACHE_FILE = '/tmp/.market-cache.json';
let cache = {};

function loadCache() {
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch(e) { cache = {}; }
}
function saveCache() {
  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)); } catch(e) {}
}
function seen(key) { return !!cache[key]; }
function markSeen(key) { cache[key] = Date.now(); saveCache(); }

// Prune old cache keys (>24h) to avoid growing forever
function pruneCache() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const k of Object.keys(cache)) {
    if (cache[k] < cutoff) delete cache[k];
  }
  saveCache();
}

async function tg(title, body, link, emoji) {
  const linkPart = link ? `\n\n<a href="${link}">🔗 Read more</a>` : '';
  const text = `${emoji} <b>${title}</b>\n\n${body}${linkPart}`;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true
    }, { timeout: 12000 });
    console.log(`✅ ${title.substring(0, 70)}`);
  } catch(e) {
    console.error(`❌ TG failed: ${e.response?.data?.description || e.message}`);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── RSS PARSER (no npm module needed) ───────────────────────────────────────
function parseRSS(xml) {
  const items = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/g) || [];
  for (const block of itemBlocks) {
    const title = (block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
                   block.match(/<title[^>]*>([\s\S]*?)<\/title>/))?.[1]?.trim();
    const link  = (block.match(/<link[^>]*>(https?:\/\/[^<]+)<\/link>/) ||
                   block.match(/<link[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/link>/))?.[1]?.trim();
    const desc  = (block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
                   block.match(/<description[^>]*>([\s\S]*?)<\/description>/))?.[1]
                   ?.replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim().substring(0,200);
    if (title && link) items.push({ title, link, desc: desc || '' });
  }
  return items;
}

async function fetchRSS(url) {
  const res = await axios.get(url, {
    timeout: 12000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketBot/1.0)' }
  });
  return parseRSS(res.data);
}

// ─── 1. CRYPTO PRICES ────────────────────────────────────────────────────────
async function checkCryptoPrices() {
  console.log('\n💰 Crypto prices...');
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&price_change_percentage=1h,24h,7d',
      { timeout: 15000 }
    );
    for (const coin of res.data) {
      const ch24 = coin.price_change_percentage_24h;
      const ch1h  = coin.price_change_percentage_1h_in_currency;
      if (!ch24) continue;
      const key = `price_${coin.id}_${new Date().toDateString()}`;
      if (Math.abs(ch24) > 7 && !seen(key)) {
        markSeen(key);
        const e = ch24 > 0 ? '📈' : '📉';
        await tg(
          `${coin.name} ${ch24 > 0 ? '+' : ''}${ch24.toFixed(1)}% today`,
          `<b>Price:</b> $${coin.current_price?.toLocaleString()}\n<b>1h:</b> ${ch1h > 0 ? '+' : ''}${ch1h?.toFixed(2) || 'N/A'}%  |  <b>24h:</b> ${ch24 > 0 ? '+' : ''}${ch24.toFixed(2)}%  |  <b>7d:</b> ${coin.price_change_percentage_7d_in_currency > 0 ? '+' : ''}${coin.price_change_percentage_7d_in_currency?.toFixed(2) || 'N/A'}%\n<b>Volume:</b> $${(coin.total_volume / 1e6).toFixed(0)}M\n<b>Market Cap:</b> $${(coin.market_cap / 1e9).toFixed(1)}B`,
          `https://www.coingecko.com/en/coins/${coin.id}`, e
        );
        await sleep(600);
      }
    }
  } catch(e) { console.error('Crypto prices failed:', e.message); }
}

// ─── 2. FEAR & GREED ─────────────────────────────────────────────────────────
async function checkFearGreed() {
  console.log('😨 Fear & Greed...');
  try {
    const res  = await axios.get('https://api.alternative.me/fng/', { timeout: 10000 });
    const d    = res.data.data?.[0];
    if (!d) return;
    const val  = parseInt(d.value);
    const key  = `fng_${new Date().toDateString()}`;
    if (!seen(key)) {
      markSeen(key);
      const e = val < 25 ? '🔴' : val < 45 ? '😨' : val > 75 ? '🟢' : val > 55 ? '😏' : '😐';
      const signal = val < 25 ? 'EXTREME FEAR — Historically a buying opportunity'
        : val < 45 ? 'Fear — Market nervous, watch for reversal'
        : val > 75 ? 'EXTREME GREED — Consider taking profits'
        : val > 55 ? 'Greed — Bulls in control'
        : 'Neutral';
      await tg(
        `Crypto Fear & Greed: ${val}/100 — ${d.value_classification}`,
        `<b>Signal:</b> ${signal}`,
        'https://alternative.me/crypto/fear-and-greed-index/', e
      );
    }
  } catch(e) { console.error('Fear/Greed failed:', e.message); }
}

// ─── 3. TRENDING COINS ───────────────────────────────────────────────────────
async function checkTrending() {
  console.log('🔥 Trending coins...');
  try {
    const res  = await axios.get('https://api.coingecko.com/api/v3/search/trending', { timeout: 10000 });
    const coins = res.data.coins?.slice(0, 7) || [];
    if (!coins.length) return;
    const key = `trending_${new Date().toDateString()}_${new Date().getHours()}`;
    if (!seen(key)) {
      markSeen(key);
      const list = coins.map((c,i) =>
        `${i+1}. <a href="https://www.coingecko.com/en/coins/${c.item.id}">${c.item.name}</a> (${c.item.symbol.toUpperCase()})`
      ).join('\n');
      await tg('🔥 Top Trending Coins Right Now', `Coins getting the most market attention:\n\n${list}`,
        'https://www.coingecko.com/en/discover', '🔥');
    }
  } catch(e) { console.error('Trending failed:', e.message); }
}

// ─── 4. NEW COIN LISTINGS ────────────────────────────────────────────────────
async function checkNewListings() {
  console.log('💎 New coin listings...');
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/list/new', { timeout: 10000 });
    const newCoins = res.data?.slice(0, 5) || [];
    for (const coin of newCoins) {
      const key = `newcoin_${coin.id}`;
      if (!seen(key)) {
        markSeen(key);
        await tg(
          `💎 New Coin Listed: ${coin.name} (${coin.symbol?.toUpperCase()})`,
          `<b>Name:</b> ${coin.name}\n<b>Symbol:</b> ${coin.symbol?.toUpperCase()}\n<b>Signal:</b> Brand new listing — early opportunity`,
          `https://www.coingecko.com/en/coins/${coin.id}`, '💎'
        );
        await sleep(600);
      }
    }
  } catch(e) { console.error('New listings failed:', e.message); }
}

// ─── 5. GLOBAL MARKET SNAPSHOT ───────────────────────────────────────────────
async function checkGlobalMarket() {
  console.log('🌍 Global market...');
  try {
    const res  = await axios.get('https://api.coingecko.com/api/v3/global', { timeout: 10000 });
    const d    = res.data.data;
    const key  = `global_${new Date().toDateString()}_${new Date().getHours()}`;
    if (!seen(key)) {
      markSeen(key);
      const mcapChange = d.market_cap_change_percentage_24h_usd;
      const e = mcapChange > 0 ? '🟢' : '🔴';
      await tg(
        `Crypto Market Cap ${mcapChange > 0 ? '+' : ''}${mcapChange?.toFixed(2)}% in 24h`,
        `<b>Total Market Cap:</b> $${(d.total_market_cap?.usd / 1e12).toFixed(2)}T\n<b>24h Volume:</b> $${(d.total_volume?.usd / 1e9).toFixed(1)}B\n<b>BTC Dominance:</b> ${d.btc_dominance?.toFixed(1)}%\n<b>ETH Dominance:</b> ${d.eth_dominance?.toFixed(1)}%\n<b>Active Cryptos:</b> ${d.active_cryptocurrencies?.toLocaleString()}`,
        'https://www.coingecko.com/en/', e
      );
    }
  } catch(e) { console.error('Global market failed:', e.message); }
}

// ─── 6. BREAKING FINANCIAL NEWS (RSS) ────────────────────────────────────────
async function checkBreakingNews() {
  console.log('📰 Breaking news...');

  const FEEDS = [
    { name: 'Reuters Business', url: 'https://feeds.reuters.com/reuters/businessNews' },
    { name: 'Yahoo Finance',    url: 'https://finance.yahoo.com/news/rssindex' },
    { name: 'MarketWatch',      url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories' },
    { name: 'CNBC',             url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html' },
    { name: 'Investing.com',    url: 'https://www.investing.com/rss/news.rss' },
  ];

  const KEYWORDS = [
    'fed', 'federal reserve', 'interest rate', 'inflation', 'cpi', 'jobs report',
    'gdp', 'recession', 'earnings', 'beats', 'misses', 'ipo', 'merger', 'acquisition',
    'bankruptcy', 'layoffs', 'tariff', 'sanction', 'trump', 'crypto', 'bitcoin',
    'crash', 'surge', 'rally', 'plunge', 'record', 'all-time', 'rate cut', 'rate hike',
    'sec', 'investigation', 'fraud', 'insider', 'short', 'squeeze', 'short squeeze'
  ];

  for (const feed of FEEDS) {
    try {
      const items = await fetchRSS(feed.url);
      for (const item of items.slice(0, 8)) {
        const titleLower = item.title.toLowerCase();
        const isImportant = KEYWORDS.some(kw => titleLower.includes(kw));
        if (!isImportant) continue;
        const key = `news_${item.title.substring(0, 60).replace(/\s/g, '_')}`;
        if (seen(key)) continue;
        markSeen(key);
        await tg(
          item.title.substring(0, 100),
          item.desc ? item.desc.substring(0, 250) : 'Breaking market news',
          item.link, '📰'
        );
        await sleep(800);
      }
    } catch(e) { console.error(`News feed failed (${feed.name}): ${e.message}`); }
  }
}

// ─── 7. REDDIT SENTIMENT (WSB + Stocks + Crypto) ─────────────────────────────
async function checkRedditSentiment() {
  console.log('👾 Reddit sentiment...');

  const SUBS = [
    { name: 'wallstreetbets', label: 'WallStreetBets' },
    { name: 'stocks',         label: 'r/stocks' },
    { name: 'CryptoCurrency', label: 'r/CryptoCurrency' },
  ];

  for (const sub of SUBS) {
    try {
      const res = await axios.get(`https://www.reddit.com/r/${sub.name}/hot.json?limit=10`, {
        headers: { 'User-Agent': 'MarketMonitorBot/1.0' }, timeout: 12000
      });
      const posts = res.data?.data?.children || [];

      // Find post with most engagement (upvotes) that we haven't sent yet
      for (const post of posts) {
        const d = post.data;
        if (d.score < 500) continue; // Only high-engagement posts
        const key = `reddit_${d.id}`;
        if (seen(key)) continue;
        markSeen(key);

        const titleLower = d.title.toLowerCase();
        const isBullish = ['buy', 'bull', 'moon', 'calls', 'long', 'yolo', 'rocket'].some(k => titleLower.includes(k));
        const isBearish = ['sell', 'bear', 'puts', 'short', 'crash', 'dump', 'rip'].some(k => titleLower.includes(k));
        const sentiment = isBullish ? '🟢 Bullish' : isBearish ? '🔴 Bearish' : '⚪ Neutral';

        await tg(
          `${sub.label}: ${d.title.substring(0, 80)}`,
          `<b>Upvotes:</b> ${d.score.toLocaleString()}\n<b>Comments:</b> ${d.num_comments.toLocaleString()}\n<b>Sentiment:</b> ${sentiment}`,
          `https://reddit.com${d.permalink}`, '👾'
        );
        break; // One per subreddit per cycle
      }
    } catch(e) { console.error(`Reddit ${sub.name} failed: ${e.message}`); }
    await sleep(500);
  }
}

// ─── 8. SEC INSIDER TRADING (EDGAR) ──────────────────────────────────────────
async function checkInsiderTrading() {
  console.log('🔒 SEC insider filings...');
  try {
    // EDGAR full-text search for recent Form 4 filings (insider trades)
    const res = await axios.get(
      'https://efts.sec.gov/LATEST/search-index?q=%22form+4%22&dateRange=custom&startdt=' +
      new Date().toISOString().split('T')[0] + '&enddt=' + new Date().toISOString().split('T')[0] +
      '&_source=file_date,period_of_report,entity_name,file_num,form_type,file_num_search_page_url&hits.hits.total.value=true&hits.hits._source=true&hits.hits.highlight=true',
      { timeout: 12000, headers: { 'User-Agent': 'MarketMonitorBot contact@example.com' } }
    );
    const hits = res.data?.hits?.hits || [];
    for (const hit of hits.slice(0, 3)) {
      const src = hit._source;
      const key = `sec_${src.file_num || hit._id}`;
      if (seen(key)) continue;
      markSeen(key);
      await tg(
        `🔒 SEC Insider Filing: ${src.entity_name}`,
        `<b>Company:</b> ${src.entity_name}\n<b>Form:</b> Form 4 (Insider Trade)\n<b>Filed:</b> ${src.file_date}\n<b>Signal:</b> Executive buying/selling detected`,
        `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=${encodeURIComponent(src.entity_name)}&type=4&dateb=&owner=include&count=10`,
        '🔒'
      );
      await sleep(600);
    }
  } catch(e) { console.error('SEC EDGAR failed:', e.message); }
}

// ─── 9. US TREASURY YIELDS ───────────────────────────────────────────────────
async function checkTreasuryYields() {
  console.log('🏦 Treasury yields...');
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await axios.get(
      `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/pages/xml?data=daily_treasury_yield_curve&field_tdr_date_value_month=${today.substring(0,7).replace('-','')}`,
      { timeout: 12000, headers: { 'User-Agent': 'MarketMonitorBot/1.0' } }
    );
    const xml = res.data;
    // Parse 2yr and 10yr yields
    const tenYr = xml.match(/<d:BC_10YEAR>([\d.]+)<\/d:BC_10YEAR>/)?.[1];
    const twoYr = xml.match(/<d:BC_2YEAR>([\d.]+)<\/d:BC_2YEAR>/)?.[1];
    if (!tenYr || !twoYr) return;
    const spread = (parseFloat(tenYr) - parseFloat(twoYr)).toFixed(2);
    const key = `treasury_${today}`;
    if (!seen(key)) {
      markSeen(key);
      const inverted = parseFloat(spread) < 0;
      await tg(
        `🏦 US Treasury Yields — ${today}`,
        `<b>2-Year Yield:</b> ${twoYr}%\n<b>10-Year Yield:</b> ${tenYr}%\n<b>2/10 Spread:</b> ${spread}%\n<b>Yield Curve:</b> ${inverted ? '⚠️ INVERTED (recession signal)' : '✅ Normal'}`,
        'https://home.treasury.gov/resource-center/data-chart-center/interest-rates',
        inverted ? '⚠️' : '🏦'
      );
    }
  } catch(e) { console.error('Treasury yields failed:', e.message); }
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] MARKET MONITOR CYCLE\n${'='.repeat(60)}`);
  loadCache();
  pruneCache();

  // Run all checks — if one fails, others still run
  const checks = [
    checkCryptoPrices,
    checkFearGreed,
    checkTrending,
    checkNewListings,
    checkGlobalMarket,
    checkBreakingNews,
    checkRedditSentiment,
    checkInsiderTrading,
    checkTreasuryYields,
  ];

  for (const check of checks) {
    try { await check(); } catch(e) { console.error(`Check failed: ${e.message}`); }
    await sleep(500);
  }

  console.log(`\n✅ Cycle complete at ${new Date().toLocaleTimeString()}`);
}

run();
setInterval(run, 5 * 60 * 1000);

process.on('uncaughtException', (e) => {
  console.error('CRASH:', e.message);
  setTimeout(run, 10000);
});
process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED:', e);
});
