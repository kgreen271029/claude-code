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

// Credentials come ONLY from environment / GitHub Secrets — never hardcoded,
// so the repo can be public without leaking the bot token.
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN || !CHAT_ID) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Set them as GitHub Secrets / env vars.');
  process.exit(1);
}

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

let alertCount = 0;

async function tg(title, body, link, emoji) {
  const linkPart = link ? `\n\n<a href="${link}">🔗 Read more</a>` : '';
  const text = `${emoji} <b>${title}</b>\n\n${body}${linkPart}`;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true
    }, { timeout: 12000 });
    alertCount++;
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

// ─── YAHOO FINANCE HELPER (free, no key) ─────────────────────────────────────
async function yfQuote(symbol) {
  const res = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
    { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 MarketBot/1.0' } }
  );
  const m = res.data?.chart?.result?.[0]?.meta;
  if (!m) return null;
  const price = m.regularMarketPrice;
  const prev  = m.chartPreviousClose || m.previousClose;
  const change = prev ? ((price - prev) / prev) * 100 : 0;
  return { price, prev, change, symbol };
}

// ─── 10. STOCK INDICES (S&P, Nasdaq, Dow, VIX, Russell) ──────────────────────
async function checkStockIndices() {
  console.log('📊 Stock indices...');
  const INDICES = [
    { sym: '^GSPC', name: 'S&P 500' },
    { sym: '^IXIC', name: 'Nasdaq' },
    { sym: '^DJI',  name: 'Dow Jones' },
    { sym: '^RUT',  name: 'Russell 2000' },
    { sym: '^VIX',  name: 'VIX (Fear Index)' },
  ];
  const key = `indices_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const lines = [];
    for (const idx of INDICES) {
      const q = await yfQuote(idx.sym);
      if (!q) continue;
      const e = q.change > 0 ? '🟢' : '🔴';
      lines.push(`${e} <b>${idx.name}:</b> ${q.price?.toLocaleString(undefined,{maximumFractionDigits:2})} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`);
      await sleep(300);
    }
    if (lines.length) {
      markSeen(key);
      await tg('US Market Indices', lines.join('\n'),
        'https://finance.yahoo.com/', '📊');
    }
  } catch(e) { console.error('Indices:', e.message); }
}

// ─── 11. BIG STOCK MOVERS (mega-cap watchlist) ───────────────────────────────
async function checkStockMovers() {
  console.log('🚀 Stock movers...');
  const STOCKS = ['AAPL','MSFT','NVDA','TSLA','AMZN','GOOGL','META','AMD','NFLX','COIN','PLTR','MSTR','GME','AMC'];
  for (const sym of STOCKS) {
    try {
      const q = await yfQuote(sym);
      if (!q || !q.change) continue;
      const key = `stock_${sym}_${new Date().toDateString()}`;
      if (Math.abs(q.change) > 4 && !seen(key)) {
        markSeen(key);
        const e = q.change > 0 ? '📈' : '📉';
        await tg(
          `${sym} ${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%`,
          `<b>Price:</b> $${q.price?.toLocaleString(undefined,{maximumFractionDigits:2})}\n<b>Change:</b> ${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%\n<b>Prev Close:</b> $${q.prev?.toFixed(2)}`,
          `https://finance.yahoo.com/quote/${sym}`, e
        );
        await sleep(500);
      }
    } catch(e) { console.error(`Stock ${sym}:`, e.message); }
    await sleep(200);
  }
}

// ─── 12. COMMODITIES (Gold, Oil, Silver, NatGas) ─────────────────────────────
async function checkCommodities() {
  console.log('🛢️ Commodities...');
  const COMM = [
    { sym: 'GC=F', name: 'Gold' },
    { sym: 'SI=F', name: 'Silver' },
    { sym: 'CL=F', name: 'Crude Oil' },
    { sym: 'NG=F', name: 'Natural Gas' },
  ];
  const key = `comm_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const lines = [];
    for (const c of COMM) {
      const q = await yfQuote(c.sym);
      if (!q) continue;
      const e = q.change > 0 ? '🟢' : '🔴';
      lines.push(`${e} <b>${c.name}:</b> $${q.price?.toFixed(2)} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`);
      await sleep(300);
    }
    if (lines.length) {
      markSeen(key);
      await tg('Commodities', lines.join('\n'), 'https://finance.yahoo.com/commodities/', '🛢️');
    }
  } catch(e) { console.error('Commodities:', e.message); }
}

// ─── 13. FOREX & DOLLAR INDEX ────────────────────────────────────────────────
async function checkForex() {
  console.log('💵 Forex / Dollar...');
  const FX = [
    { sym: 'DX-Y.NYB', name: 'US Dollar Index (DXY)' },
    { sym: 'EURUSD=X', name: 'EUR/USD' },
    { sym: 'USDJPY=X', name: 'USD/JPY' },
    { sym: 'GBPUSD=X', name: 'GBP/USD' },
  ];
  const key = `forex_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const lines = [];
    for (const f of FX) {
      const q = await yfQuote(f.sym);
      if (!q) continue;
      const e = q.change > 0 ? '🟢' : '🔴';
      lines.push(`${e} <b>${f.name}:</b> ${q.price?.toFixed(3)} (${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%)`);
      await sleep(300);
    }
    if (lines.length) {
      markSeen(key);
      await tg('Forex & Dollar Index', lines.join('\n'), 'https://finance.yahoo.com/currencies/', '💵');
    }
  } catch(e) { console.error('Forex:', e.message); }
}

// ─── 14. CRYPTO TOP GAINERS / LOSERS ─────────────────────────────────────────
async function checkGainersLosers() {
  console.log('🎢 Crypto gainers/losers...');
  const key = `gl_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&price_change_percentage=24h',
      { timeout: 15000 }
    );
    const coins = res.data.filter(c => c.price_change_percentage_24h != null && c.market_cap > 50e6);
    const sorted = [...coins].sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
    const gainers = sorted.slice(0, 5);
    const losers  = sorted.slice(-5).reverse();
    if (gainers.length) {
      markSeen(key);
      const g = gainers.map(c => `📈 <b>${c.symbol.toUpperCase()}</b> +${c.price_change_percentage_24h.toFixed(1)}% ($${c.current_price?.toLocaleString()})`).join('\n');
      const l = losers.map(c => `📉 <b>${c.symbol.toUpperCase()}</b> ${c.price_change_percentage_24h.toFixed(1)}% ($${c.current_price?.toLocaleString()})`).join('\n');
      await tg('Crypto Top Movers (24h)',
        `<b>🔥 TOP GAINERS</b>\n${g}\n\n<b>🩸 TOP LOSERS</b>\n${l}`,
        'https://www.coingecko.com/en/highlights', '🎢');
    }
  } catch(e) { console.error('Gainers/losers:', e.message); }
}

// ─── 15. HOT CRYPTO SECTORS (categories) ─────────────────────────────────────
async function checkCryptoSectors() {
  console.log('🏷️ Crypto sectors...');
  const key = `sectors_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/categories?order=market_cap_change_24h_desc', { timeout: 12000 });
    const cats = (res.data || []).filter(c => c.market_cap_change_24h != null).slice(0, 5);
    if (cats.length) {
      markSeen(key);
      const list = cats.map((c,i) => `${i+1}. <b>${c.name}</b> ${c.market_cap_change_24h > 0 ? '+' : ''}${c.market_cap_change_24h.toFixed(1)}%`).join('\n');
      await tg('Hottest Crypto Sectors (24h)',
        `Money rotating into:\n\n${list}`,
        'https://www.coingecko.com/en/categories', '🏷️');
    }
  } catch(e) { console.error('Sectors:', e.message); }
}

// ─── 16. ETHEREUM GAS FEES ───────────────────────────────────────────────────
async function checkGasFees() {
  console.log('⛽ ETH gas...');
  const key = `gas_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/coins/ethereum', { timeout: 10000 }).catch(()=>null);
    // Use Etherscan-free gas oracle alternative via blocknative public endpoint
    const gasRes = await axios.get('https://ethgasstation.info/api/ethgasAPI.json', { timeout: 8000 }).catch(()=>null);
    if (gasRes?.data) {
      markSeen(key);
      const d = gasRes.data;
      await tg('Ethereum Gas Fees',
        `<b>Fast:</b> ${(d.fast/10).toFixed(0)} gwei\n<b>Standard:</b> ${(d.average/10).toFixed(0)} gwei\n<b>Slow:</b> ${(d.safeLow/10).toFixed(0)} gwei\n<b>Signal:</b> ${d.average/10 > 50 ? '⚠️ High activity / congestion' : '✅ Network calm'}`,
        'https://etherscan.io/gastracker', '⛽');
    }
  } catch(e) { console.error('Gas:', e.message); }
}

// ─── 17. CRYPTO DERIVATIVES / OPEN INTEREST ──────────────────────────────────
async function checkDerivatives() {
  console.log('📐 Derivatives...');
  const key = `deriv_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/derivatives/exchanges?order=open_interest_btc_desc&per_page=5', { timeout: 12000 });
    const ex = res.data || [];
    if (ex.length) {
      markSeen(key);
      const list = ex.map((e,i) => `${i+1}. <b>${e.name}</b> — OI: ${e.open_interest_btc?.toLocaleString(undefined,{maximumFractionDigits:0})} BTC, Vol: ${(e.trade_volume_24h_btc/1000).toFixed(0)}K BTC`).join('\n');
      await tg('Crypto Derivatives — Open Interest',
        `Largest futures exchanges by open interest:\n\n${list}\n\nHigh OI = leverage building, watch for liquidation cascades.`,
        'https://www.coingecko.com/en/derivatives', '📐');
    }
  } catch(e) { console.error('Derivatives:', e.message); }
}

// ─── 18. CRYPTO EXCHANGE LISTINGS / NEWS (Binance, Coinbase) ─────────────────
async function checkExchangeNews() {
  console.log('🏦 Exchange announcements...');
  const FEEDS = [
    { name: 'Coindesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
    { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
    { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  ];
  const KW = ['binance','coinbase','listing','lists','delisting','etf','sec','hack','exploit','launch','airdrop','upgrade','halving','partnership'];
  for (const feed of FEEDS) {
    try {
      const items = await fetchRSS(feed.url);
      for (const item of items.slice(0, 8)) {
        const tl = item.title.toLowerCase();
        if (!KW.some(k => tl.includes(k))) continue;
        const key = `exnews_${item.title.substring(0,60).replace(/\W/g,'_')}`;
        if (seen(key)) continue;
        markSeen(key);
        await tg(item.title.substring(0,100),
          (item.desc || 'Crypto news').substring(0,220), item.link, '🏦');
        await sleep(700);
      }
    } catch(e) { console.error(`ExNews ${feed.name}:`, e.message); }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TECHNICAL ANALYSIS ENGINE — trade setups, options flow, sector rotation
// ═══════════════════════════════════════════════════════════════════════════

// Daily OHLCV history from Yahoo (free, covers stocks AND crypto like BTC-USD)
async function yfDaily(symbol, range = '1y') {
  const res = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d`,
    { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 MarketBot/1.0' } }
  );
  const r = res.data?.chart?.result?.[0];
  if (!r) return null;
  const q = r.indicators?.quote?.[0] || {};
  const closes  = (q.close  || []).filter(x => x != null);
  const volumes = (q.volume || []).filter(x => x != null);
  const highs   = (q.high   || []).filter(x => x != null);
  const lows    = (q.low    || []).filter(x => x != null);
  return { closes, volumes, highs, lows, meta: r.meta };
}

function sma(arr, n) {
  if (!arr || arr.length < n) return null;
  return arr.slice(-n).reduce((a, b) => a + b, 0) / n;
}

function rsi(closes, period = 14) {
  if (!closes || closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period, avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// Build an actionable trade-setup card (entry / stop / target / R:R)
function buildSetup(sym, d) {
  const closes = d.closes;
  if (closes.length < 60) return null;
  const price  = closes[closes.length - 1];
  const r      = rsi(closes);
  const s20    = sma(closes, 20);
  const s50    = sma(closes, 50);
  const s200   = sma(closes, 200);
  const avgVol = sma(d.volumes, 20);
  const lastVol = d.volumes[d.volumes.length - 1];
  const volX   = avgVol ? lastVol / avgVol : 1;
  const hi52   = Math.max(...d.highs.slice(-252));
  const lo52   = Math.min(...d.lows.slice(-252));
  if (r == null || !s50) return null;

  const fmt = (x) => x >= 100 ? x.toFixed(2) : x.toFixed(x >= 1 ? 3 : 6);
  const rr = (entry, stop, target) => Math.abs((target - entry) / (entry - stop)).toFixed(2);

  // 1) BREAKOUT LONG — new high momentum + volume
  if (price >= hi52 * 0.985 && volX >= 1.4) {
    const entry = price, stop = price * 0.93, target = price * 1.15;
    return { dir: '🟢 LONG — Breakout', conf: volX >= 2 ? 'HIGH' : 'MED',
      reason: `Breaking 52-wk high ($${fmt(hi52)}) on ${volX.toFixed(1)}× volume. Momentum.`,
      entry, stop, target, rr: rr(entry, stop, target), price, r, emoji: '🚀' };
  }
  // 2) OVERSOLD BOUNCE LONG — dip in an uptrend
  if (r < 35 && s200 && price > s200) {
    const entry = price, stop = Math.min(lo52 * 1.01, price * 0.94), target = s20 || price * 1.10;
    return { dir: '🟢 LONG — Oversold bounce', conf: r < 28 ? 'HIGH' : 'MED',
      reason: `RSI ${r.toFixed(0)} (oversold) but price above 200-day ($${fmt(s200)}) = uptrend dip.`,
      entry, stop, target, rr: rr(entry, stop, target), price, r, emoji: '🎯' };
  }
  // 3) TREND-FOLLOW LONG — golden alignment
  if (s200 && s50 > s200 && price > s50 && r >= 45 && r <= 65) {
    const entry = price, stop = s50 * 0.97, target = price * 1.12;
    return { dir: '🟢 LONG — Trend follow', conf: 'MED',
      reason: `Uptrend (50d>200d), price riding 50-day, RSI ${r.toFixed(0)} healthy.`,
      entry, stop, target, rr: rr(entry, stop, target), price, r, emoji: '📈' };
  }
  // 4) BREAKDOWN SHORT/AVOID — losing 52-wk low on volume
  if (price <= lo52 * 1.02 && volX >= 1.4) {
    const entry = price, stop = price * 1.07, target = price * 0.85;
    return { dir: '🔴 SHORT / AVOID — Breakdown', conf: volX >= 2 ? 'HIGH' : 'MED',
      reason: `Breaking 52-wk low ($${fmt(lo52)}) on ${volX.toFixed(1)}× volume. Weak.`,
      entry, stop, target, rr: rr(entry, stop, target), price, r, emoji: '⚠️' };
  }
  // 5) OVERBOUGHT — take profits / don't chase
  if (r > 75) {
    return { dir: '🟡 OVERBOUGHT — Take profit / don\'t chase', conf: 'MED',
      reason: `RSI ${r.toFixed(0)} extremely overbought. Pullback risk rising.`,
      entry: price, stop: price * 1.05, target: (s20 || price * 0.92), rr: '—', price, r, emoji: '🔥' };
  }
  return null;
}

async function scanSetups(label, symbols, cacheTag, isCrypto) {
  console.log(`\n🎯 ${label} trade setups...`);
  for (const sym of symbols) {
    try {
      const d = await yfDaily(sym);
      if (!d) { await sleep(150); continue; }
      const s = buildSetup(sym, d);
      if (s) {
        const key = `setup_${cacheTag}_${sym}_${s.dir.substring(0,12)}_${new Date().toDateString()}`;
        if (!seen(key)) {
          markSeen(key);
          const ccy = isCrypto || sym.includes('-USD');
          const name = sym.replace('-USD', '');
          const f = (x) => typeof x === 'number' ? (x >= 100 ? x.toFixed(2) : x.toFixed(x >= 1 ? 3 : 6)) : x;
          await tg(
            `${s.emoji} TRADE SETUP: ${name} — ${s.dir}`,
            `<b>Confidence:</b> ${s.conf}\n<b>Price:</b> $${f(s.price)}  |  <b>RSI:</b> ${s.r?.toFixed(0)}\n\n<b>Entry:</b> $${f(s.entry)}\n<b>Stop:</b> $${f(s.stop)}\n<b>Target:</b> $${f(s.target)}\n<b>Risk/Reward:</b> ${s.rr}:1\n\n<b>Why:</b> ${s.reason}\n\n<i>Not financial advice — manage your risk.</i>`,
            ccy ? `https://www.coingecko.com/` : `https://finance.yahoo.com/quote/${sym}`,
            s.emoji
          );
          await sleep(400);
        }
      }
    } catch(e) { console.error(`Setup ${sym}:`, e.message); }
    await sleep(200);
  }
}

// 19. STOCK TRADE SETUPS
async function checkStockSetups() {
  const WATCH = ['AAPL','MSFT','NVDA','TSLA','AMZN','GOOGL','META','AMD','NFLX','COIN',
                 'PLTR','MSTR','GME','AMC','SPY','QQQ','AVGO','MU','SMCI','ARM','BABA','UBER'];
  await scanSetups('Stock', WATCH, 'stk', false);
}

// 20. CRYPTO TRADE SETUPS (Yahoo crypto symbols avoid CoinGecko rate limits)
async function checkCryptoSetups() {
  const COINS = ['BTC-USD','ETH-USD','SOL-USD','BNB-USD','XRP-USD','DOGE-USD',
                 'ADA-USD','AVAX-USD','LINK-USD','MATIC-USD','DOT-USD','LTC-USD'];
  await scanSetups('Crypto', COINS, 'cx', true);
}

// 21. OPTIONS-FLOW PROXY — unusual volume + direction = likely big call/put flow
async function checkOptionsFlow() {
  console.log('\n📑 Options-flow signals...');
  const NAMES = ['NVDA','TSLA','AAPL','AMD','META','AMZN','COIN','PLTR','MSTR','SPY','QQQ','GME','SMCI','MU','NFLX'];
  for (const sym of NAMES) {
    try {
      const d = await yfDaily(sym, '3mo');
      if (!d || d.closes.length < 21) { await sleep(150); continue; }
      const price = d.closes[d.closes.length - 1];
      const prev  = d.closes[d.closes.length - 2];
      const dayChg = ((price - prev) / prev) * 100;
      const avgVol = sma(d.volumes, 20);
      const lastVol = d.volumes[d.volumes.length - 1];
      const volX = avgVol ? lastVol / avgVol : 1;
      // Unusual volume (>2x) + meaningful move = institutional/options positioning
      if (volX >= 2 && Math.abs(dayChg) >= 3) {
        const key = `oflow_${sym}_${new Date().toDateString()}`;
        if (!seen(key)) {
          markSeen(key);
          const bias = dayChg > 0 ? '🟢 CALL-side (bullish) flow likely' : '🔴 PUT-side (bearish) flow likely';
          await tg(
            `📑 UNUSUAL ACTIVITY: ${sym} ${dayChg > 0 ? '+' : ''}${dayChg.toFixed(1)}%`,
            `<b>Volume:</b> ${volX.toFixed(1)}× the 20-day average\n<b>Move:</b> ${dayChg > 0 ? '+' : ''}${dayChg.toFixed(2)}%\n<b>Price:</b> $${price.toFixed(2)}\n<b>Read:</b> ${bias}\n\nBig volume + sharp move = smart money positioning. Watch for follow-through.`,
            `https://finance.yahoo.com/quote/${sym}/options`, '📑'
          );
          await sleep(400);
        }
      }
    } catch(e) { console.error(`OFlow ${sym}:`, e.message); }
    await sleep(150);
  }
}

// 22. SECTOR ROTATION — which sectors money is flowing into/out of
async function checkSectorRotation() {
  console.log('\n🧭 Sector rotation...');
  const key = `sector_rot_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  const SECTORS = [
    { sym: 'XLK', name: 'Technology' }, { sym: 'XLF', name: 'Financials' },
    { sym: 'XLE', name: 'Energy' },     { sym: 'XLV', name: 'Healthcare' },
    { sym: 'XLY', name: 'Consumer Disc' }, { sym: 'XLP', name: 'Staples' },
    { sym: 'XLI', name: 'Industrials' }, { sym: 'XLU', name: 'Utilities' },
    { sym: 'XLB', name: 'Materials' },   { sym: 'XLC', name: 'Communications' },
    { sym: 'XLRE', name: 'Real Estate' },
  ];
  try {
    const rows = [];
    for (const s of SECTORS) {
      const q = await yfQuote(s.sym);
      if (q) rows.push({ name: s.name, change: q.change });
      await sleep(200);
    }
    if (rows.length >= 5) {
      markSeen(key);
      rows.sort((a, b) => b.change - a.change);
      const top = rows.slice(0, 3).map(r => `🟢 <b>${r.name}</b> ${r.change > 0 ? '+' : ''}${r.change.toFixed(2)}%`).join('\n');
      const bot = rows.slice(-3).reverse().map(r => `🔴 <b>${r.name}</b> ${r.change > 0 ? '+' : ''}${r.change.toFixed(2)}%`).join('\n');
      const leader = rows[0].name;
      const risk = ['Technology','Consumer Disc','Communications'].includes(leader) ? 'Risk-ON (growth leading)' :
                   ['Utilities','Staples','Healthcare'].includes(leader) ? 'Risk-OFF (defensives leading)' : 'Mixed';
      await tg('🧭 Sector Rotation Today',
        `<b>Money flowing IN:</b>\n${top}\n\n<b>Money flowing OUT:</b>\n${bot}\n\n<b>Regime:</b> ${risk}`,
        'https://finance.yahoo.com/sectors', '🧭');
    }
  } catch(e) { console.error('Sector rotation:', e.message); }
}

// 23. VOLATILITY REGIME — VIX-based risk-on/off call
async function checkVolatilityRegime() {
  console.log('\n🌡️ Volatility regime...');
  const key = `vix_regime_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const q = await yfQuote('^VIX');
    if (!q) return;
    const v = q.price;
    markSeen(key);
    const regime = v >= 30 ? '🔴 HIGH FEAR — big swings, size down, hedges pay'
      : v >= 20 ? '🟡 ELEVATED — choppy, be selective'
      : v <= 13 ? '🟢 COMPLACENT — calm, but watch for surprise reversals'
      : '🟢 NORMAL — trend-friendly conditions';
    await tg(`🌡️ Volatility (VIX): ${v.toFixed(1)}`,
      `<b>Regime:</b> ${regime}\n<b>Change:</b> ${q.change > 0 ? '+' : ''}${q.change.toFixed(2)}%\n\nVIX is the market's fear gauge — higher = more expected turbulence.`,
      'https://finance.yahoo.com/quote/%5EVIX', '🌡️');
  } catch(e) { console.error('VIX regime:', e.message); }
}

// 24. MARKET-WIDE TOP STOCK MOVERS (Yahoo screener — beyond the watchlist)
async function checkMarketMovers() {
  console.log('\n📊 Market-wide movers...');
  const key = `mkt_movers_${new Date().toDateString()}_${new Date().getHours()}`;
  if (seen(key)) return;
  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=10&scrIds=day_gainers',
      { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0 MarketBot/1.0' } }
    ).catch(() => null);
    const quotes = res?.data?.finance?.result?.[0]?.quotes || [];
    if (quotes.length) {
      markSeen(key);
      const list = quotes.slice(0, 8).map(q =>
        `📈 <b>${q.symbol}</b> +${q.regularMarketChangePercent?.toFixed(1)}% ($${q.regularMarketPrice?.toFixed(2)})`
      ).join('\n');
      await tg('📊 Market\'s Biggest Stock Gainers Today',
        `${list}\n\nUnusual strength — often where the action and news is.`,
        'https://finance.yahoo.com/gainers', '📊');
    }
  } catch(e) { console.error('Market movers:', e.message); }
}

// 25. GAME PLAN — consolidated "what to BUY / SELL / OPTIONS" board (~3x/day)
async function checkGamePlan() {
  console.log('\n🗒️ Building game plan...');
  const slot = Math.floor(new Date().getHours() / 8); // 3 slots/day
  const key = `gameplan_${new Date().toDateString()}_${slot}`;
  if (seen(key)) return;

  const STOCKS = ['AAPL','MSFT','NVDA','TSLA','AMZN','GOOGL','META','AMD','NFLX','COIN',
                  'PLTR','MSTR','GME','AMC','AVGO','MU','SMCI','ARM','BABA','UBER','SPY','QQQ'];
  const CRYPTO = ['BTC-USD','ETH-USD','SOL-USD','BNB-USD','XRP-USD','DOGE-USD','ADA-USD','AVAX-USD','LINK-USD'];

  const longs = [], shorts = [], flow = [];
  const rank = (s) => (s.conf === 'HIGH' ? 100 : 50) + (parseFloat(s.rr) || 0);
  const f = (x) => typeof x === 'number' ? (x >= 100 ? x.toFixed(2) : x.toFixed(x >= 1 ? 2 : 5)) : x;

  for (const sym of [...STOCKS, ...CRYPTO]) {
    try {
      const d = await yfDaily(sym);
      if (!d) { await sleep(120); continue; }
      const s = buildSetup(sym, d);
      if (!s) { await sleep(120); continue; }
      const name = sym.replace('-USD', '');
      if (s.dir.includes('LONG')) longs.push({ name, s });
      else if (s.dir.includes('SHORT') || s.dir.includes('AVOID') || s.dir.includes('OVERBOUGHT')) shorts.push({ name, s });
      // unusual-volume style flow note
      const avgVol = sma(d.volumes, 20), lastVol = d.volumes[d.volumes.length - 1];
      if (avgVol && lastVol / avgVol >= 1.8) flow.push({ name, volX: lastVol / avgVol, r: s.r });
    } catch(e) {}
    await sleep(150);
  }

  longs.sort((a, b) => rank(b.s) - rank(a.s));
  shorts.sort((a, b) => rank(b.s) - rank(a.s));
  flow.sort((a, b) => b.volX - a.volX);

  if (!longs.length && !shorts.length) return;
  markSeen(key);

  const buyLines = longs.slice(0, 6).map(x =>
    `🟢 <b>${x.name}</b> — Buy $${f(x.s.entry)} | Stop $${f(x.s.stop)} | Target $${f(x.s.target)} | R:R ${x.s.rr} <i>(${x.s.conf})</i>`
  ).join('\n') || '— none right now';

  const sellLines = shorts.slice(0, 5).map(x =>
    `🔴 <b>${x.name}</b> — ${x.s.dir.replace(/^[^A-Za-z]+/, '')} | RSI ${x.s.r?.toFixed(0)}`
  ).join('\n') || '— none right now';

  const flowLines = flow.slice(0, 5).map(x =>
    `📑 <b>${x.name}</b> — ${x.volX.toFixed(1)}× volume (RSI ${x.r?.toFixed(0)})`
  ).join('\n') || '— quiet';

  await tg(
    '🗒️ MARKET GAME PLAN — Buys / Sells / Options',
    `<b>🟢 TOP BUYS (long setups)</b>\n${buyLines}\n\n<b>🔴 SELL / AVOID</b>\n${sellLines}\n\n<b>📑 OPTIONS / UNUSUAL FLOW</b>\n${flowLines}\n\n<i>Auto-generated from live technicals. Not financial advice — always manage risk.</i>`,
    'https://finance.yahoo.com/', '🗒️'
  );
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\n${'='.repeat(60)}\n[${new Date().toISOString()}] MARKET MONITOR CYCLE\n${'='.repeat(60)}`);
  loadCache();
  pruneCache();

  // Run all checks — if one fails, others still run.
  // Each check fires its OWN alerts the moment it finds something,
  // so a single cycle can send many alerts (or zero if nothing's new).
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
    checkStockIndices,
    checkStockMovers,
    checkCommodities,
    checkForex,
    checkGainersLosers,
    checkCryptoSectors,
    checkGasFees,
    checkDerivatives,
    checkExchangeNews,
    // ── Technical analysis / trade-setup engine ──
    checkStockSetups,
    checkCryptoSetups,
    checkOptionsFlow,
    checkSectorRotation,
    checkVolatilityRegime,
    checkMarketMovers,
    checkGamePlan,
  ];

  let alertsThisCycle = 0;
  const before = alertCount;
  for (const check of checks) {
    try { await check(); } catch(e) { console.error(`Check failed: ${e.message}`); }
    await sleep(400);
  }
  alertsThisCycle = alertCount - before;

  // Guarantee at least ONE message every cycle (every 5 min minimum),
  // but checks above can and do send many more when news breaks.
  if (alertsThisCycle === 0) {
    try {
      const res = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
        { timeout: 10000 }
      );
      const b = res.data.bitcoin, e = res.data.ethereum;
      await tg('Market Pulse — All Quiet',
        `No major moves this cycle. Current levels:\n\n<b>BTC:</b> $${b.usd?.toLocaleString()} (${b.usd_24h_change > 0 ? '+' : ''}${b.usd_24h_change?.toFixed(2)}%)\n<b>ETH:</b> $${e.usd?.toLocaleString()} (${e.usd_24h_change > 0 ? '+' : ''}${e.usd_24h_change?.toFixed(2)}%)\n\nMonitoring 24 data sources + live trade-setup scanner every 5 min. Will ping the moment anything moves.`,
        'https://www.coingecko.com/en/', '🟢');
    } catch(e) { console.error('Heartbeat failed:', e.message); }
  }

  console.log(`\n✅ Cycle complete — ${alertsThisCycle} alerts sent at ${new Date().toLocaleTimeString()}`);
}

run();
// Continuous: re-scan every 3 minutes for the life of the run (~5.5h per GitHub job)
setInterval(run, 3 * 60 * 1000);

process.on('uncaughtException', (e) => {
  console.error('CRASH:', e.message);
  setTimeout(run, 10000);
});
process.on('unhandledRejection', (e) => {
  console.error('UNHANDLED:', e);
});
