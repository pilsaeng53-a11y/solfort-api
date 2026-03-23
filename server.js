// server.js
// FULL VERSION - SOLFORT PRE-DB MARKET ENGINE + SAFE PREDICTION AGGREGATOR + CUSTOM CRYPTO MARKETS

const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const { getNewsBySymbol } = require("./services/newsService");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

const SERVER_STARTED_AT = new Date().toISOString();

/* =========================
   CORE CONFIG
========================= */

const STREAM_INTERVAL_MS = 1500;
const FETCH_TIMEOUT_MS = 15000;

/* =========================
   PREDICTION CONFIG
========================= */

const PREDICTION_REFRESH_MS = 3 * 60 * 1000; // 3분
const MAX_POLY_MARKETS = 350;
const MAX_KALSHI_EVENTS = 220;
const MAX_TOTAL_PREDICTION_MARKETS = 500;

const BET_LOCK_SECONDS = 20;

/* =========================
   SYMBOL CONFIG
========================= */

const SYMBOL_CONFIG = {
  EURUSD: { category: "FOREX", displayName: "Euro / U.S. Dollar", basePrice: 1.0873, spread: 0.0001, digits: 5 },
  USDJPY: { category: "FOREX", displayName: "U.S. Dollar / Japanese Yen", basePrice: 149.42, spread: 0.01, digits: 3 },
  GBPUSD: { category: "FOREX", displayName: "British Pound / U.S. Dollar", basePrice: 1.2734, spread: 0.00012, digits: 5 },
  AUDUSD: { category: "FOREX", displayName: "Australian Dollar / U.S. Dollar", basePrice: 0.6572, spread: 0.0001, digits: 5 },

  BTC: { category: "CRYPTO", displayName: "Bitcoin", basePrice: 71484.56, spread: 0.8, digits: 2 },
  ETH: { category: "CRYPTO", displayName: "Ethereum", basePrice: 2181.52, spread: 0.25, digits: 2 },
  SOL: { category: "CRYPTO", displayName: "Solana", basePrice: 92.11, spread: 0.04, digits: 2 },
  XRP: { category: "CRYPTO", displayName: "XRP", basePrice: 1.447, spread: 0.002, digits: 4 },

  GOLD: { category: "COMMODITIES", displayName: "Gold", basePrice: 2179.4, spread: 0.35, digits: 2 },
  SILVER: { category: "COMMODITIES", displayName: "Silver", basePrice: 24.84, spread: 0.03, digits: 2 },
  NASDAQ: { category: "INDICES", displayName: "Nasdaq 100", basePrice: 18162.3, spread: 1.2, digits: 1 },
  SP500: { category: "INDICES", displayName: "S&P 500", basePrice: 5142.7, spread: 0.8, digits: 1 }
};

const CUSTOM_CRYPTO_SYMBOLS = ["BTC", "ETH", "SOL", "XRP"];
const CUSTOM_CRYPTO_TIMEFRAMES = [
  { key: "5m", label: "5 Minutes", minutes: 5 },
  { key: "15m", label: "15 Minutes", minutes: 15 },
  { key: "1h", label: "1 Hour", minutes: 60 },
  { key: "4h", label: "4 Hours", minutes: 240 },
  { key: "1d", label: "1 Day", minutes: 1440 }
];

/* =========================
   CACHE
========================= */

const predictionCache = {
  updatedAt: null,
  markets: [],
  categories: [],
  stats: {
    lastRefreshStatus: "idle",
    lastError: null,
    polymarketCount: 0,
    kalshiCount: 0,
    customCount: 0,
    totalMerged: 0
  }
};

let isPredictionRefreshing = false;

/* =========================
   GENERIC UTILS
========================= */

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function safeNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function roundPrice(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function titleCase(input) {
  return String(input || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

async function fetchJsonWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SolFort/1.0"
      }
    });

    if (!res.ok) {
      throw new Error(`Fetch failed ${res.status}: ${url}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/* =========================
   SYMBOL HELPERS
========================= */

function normalizeSymbol(input) {
  if (!input) return "";

  let raw = String(input)
    .trim()
    .toUpperCase()
    .replace(/\//g, "-")
    .replace(/_/g, "-");

  const parts = raw.split("-").filter(Boolean);
  const ignore = ["PERP", "USDT", "USDC", "USD", "T"];

  if (parts.length === 1) return raw;

  const base = parts.find((p) => !ignore.includes(p));
  return base || parts[0] || raw;
}

function toTradingViewSymbol(input) {
  const symbol = normalizeSymbol(input);

  const map = {
    EURUSD: "FX:EURUSD",
    USDJPY: "FX:USDJPY",
    GBPUSD: "FX:GBPUSD",
    AUDUSD: "FX:AUDUSD",

    BTC: "BINANCE:BTCUSDT",
    ETH: "BINANCE:ETHUSDT",
    SOL: "BINANCE:SOLUSDT",
    XRP: "BINANCE:XRPUSDT",

    GOLD: "OANDA:XAUUSD",
    SILVER: "OANDA:XAGUSD",
    NASDAQ: "OANDA:NAS100USD",
    SP500: "OANDA:SPX500USD"
  };

  return map[symbol] || symbol;
}

function ensureSymbol(input) {
  const symbol = normalizeSymbol(input);
  if (!symbol || !SYMBOL_CONFIG[symbol]) return null;
  return symbol;
}

function getDigits(symbol) {
  return SYMBOL_CONFIG[symbol]?.digits ?? 2;
}

/* =========================
   QUOTE / CANDLE ENGINE
========================= */

function generateQuote(symbol) {
  const config = SYMBOL_CONFIG[symbol];
  const now = Date.now();
  const timeFactor = now / 1000;

  const noise = pseudoRandom(timeFactor + config.basePrice) - 0.5;
  const trend = Math.sin(timeFactor / 60) * 0.001;

  const volatilityFactor =
    symbol === "BTC" || symbol === "ETH" || symbol === "SOL" || symbol === "XRP"
      ? config.basePrice * 0.0025
      : config.basePrice * 0.00035;

  const move = noise * volatilityFactor + trend * config.basePrice;
  const mid = config.basePrice + move;

  const bid = roundPrice(mid - config.spread / 2, getDigits(symbol));
  const ask = roundPrice(mid + config.spread / 2, getDigits(symbol));
  const last = roundPrice((bid + ask) / 2, getDigits(symbol));
  const dailyOpen = config.basePrice;
  const change = last - dailyOpen;
  const changePercent = Number(((change / dailyOpen) * 100).toFixed(2));

  return {
    symbol,
    displayName: config.displayName,
    category: config.category,
    bid,
    ask,
    last,
    mid: last,
    spread: roundPrice(ask - bid, getDigits(symbol)),
    change,
    changePercent,
    tradingViewSymbol: toTradingViewSymbol(symbol),
    updatedAt: new Date().toISOString()
  };
}

function intervalToMs(interval) {
  const map = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000
  };

  return map[interval] || map["15m"];
}

function generateCandles(symbol, interval = "15m", limit = 200) {
  const config = SYMBOL_CONFIG[symbol];
  const intervalMs = intervalToMs(interval);
  const digits = getDigits(symbol);
  const now = Date.now();

  const candles = [];
  let previousClose = config.basePrice;

  for (let i = limit - 1; i >= 0; i -= 1) {
    const time = now - i * intervalMs;
    const factorA = Math.sin(time / 300000);
    const factorB = Math.cos(time / 900000);

    const volatility =
      symbol === "BTC" || symbol === "ETH" || symbol === "SOL" || symbol === "XRP"
        ? config.basePrice * 0.004
        : config.basePrice * 0.0008;

    const drift = (factorA + factorB) * volatility * 0.25;
    const open = previousClose;
    const close = open + drift + (pseudoRandom(time) - 0.5) * volatility * 0.35;

    const highBase = Math.max(open, close);
    const lowBase = Math.min(open, close);

    const high = highBase + pseudoRandom(time + 1) * volatility * 0.2;
    const low = lowBase - pseudoRandom(time + 2) * volatility * 0.2;

    const volume =
      symbol === "BTC" || symbol === "ETH" || symbol === "SOL" || symbol === "XRP"
        ? Math.round(1000 + pseudoRandom(time + 3) * 9000)
        : Math.round(50 + pseudoRandom(time + 3) * 350);

    const candle = {
      time: new Date(time).toISOString(),
      timestamp: time,
      open: roundPrice(open, digits),
      high: roundPrice(high, digits),
      low: roundPrice(low, digits),
      close: roundPrice(close, digits),
      volume
    };

    candles.push(candle);
    previousClose = candle.close;
  }

  return candles;
}

function buildSymbolList() {
  return Object.entries(SYMBOL_CONFIG).map(([symbol, config]) => {
    const quote = generateQuote(symbol);

    return {
      symbol,
      displayName: config.displayName,
      category: config.category,
      tradingViewSymbol: toTradingViewSymbol(symbol),
      last: quote.last,
      bid: quote.bid,
      ask: quote.ask,
      spread: quote.spread,
      changePercent: quote.changePercent
    };
  });
}

/* =========================
   PREDICTION HELPERS
========================= */

function payoutFromProb(prob) {
  const p = safeNum(prob, 0);
  if (p <= 0) return null;
  return Number((1 / p).toFixed(2));
}

function normalizePredictionCategory(input) {
  const raw = String(input || "").trim().toLowerCase();

  const map = {
    trending: "Trending",
    elections: "Elections",
    politics: "Politics",
    political: "Politics",
    sports: "Sports",
    sport: "Sports",
    culture: "Culture",
    crypto: "Crypto",
    climate: "Climate",
    economy: "Economics",
    economics: "Economics",
    mentions: "Global",
    global: "Global",
    companies: "Companies",
    company: "Companies",
    financials: "Financials",
    finance: "Financials",
    tech: "Tech & Science",
    technology: "Tech & Science",
    science: "Tech & Science"
  };

  return map[raw] || titleCase(raw || "Global");
}

function buildPredictionCategories(markets) {
  const set = new Set();
  for (const market of markets) {
    if (market.category) set.add(market.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function rankPredictionMarkets(markets) {
  return markets.map((m) => {
    const volume = safeNum(m.volume, 0);
    const highestPayout = Math.max(
      ...((m.outcomes || []).length
        ? m.outcomes.map((o) => safeNum(o.payout, 0))
        : [0])
    );

    return {
      ...m,
      highestPayout,
      popularityScore: volume,
      trendingScore: volume + highestPayout * 1000
    };
  });
}

function sanitizePredictionMarkets(markets) {
  return markets
    .filter((m) => m && m.question && Array.isArray(m.outcomes) && m.outcomes.length > 0)
    .map((m) => ({
      ...m,
      externalId: String(m.externalId),
      slug: m.slug || "",
      question: String(m.question).trim(),
      category: normalizePredictionCategory(m.category),
      subcategory: m.subcategory ? String(m.subcategory).trim() : null,
      volume: safeNum(m.volume, 0),
      outcomes: m.outcomes
        .filter((o) => o && o.name)
        .slice(0, 12)
        .map((o) => ({
          name: String(o.name).trim(),
          probability: safeNum(o.probability, 0),
          payout: o.payout != null ? safeNum(o.payout, 0) : payoutFromProb(safeNum(o.probability, 0))
        }))
    }));
}

function dedupePredictionMarkets(markets) {
  const seen = new Set();
  const result = [];

  for (const market of markets) {
    const key = `${market.source}:${market.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(market);
  }

  return result;
}

function sortPredictionMarkets(rows, sort = "popular") {
  const next = [...rows];

  if (sort === "highest-odds") {
    next.sort((a, b) => safeNum(b.highestPayout, 0) - safeNum(a.highestPayout, 0));
  } else if (sort === "popular") {
    next.sort((a, b) => safeNum(b.popularityScore, 0) - safeNum(a.popularityScore, 0));
  } else if (sort === "trending") {
    next.sort((a, b) => safeNum(b.trendingScore, 0) - safeNum(a.trendingScore, 0));
  } else if (sort === "ending-soon") {
    next.sort((a, b) => {
      const aTime = a.endsAt ? new Date(a.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.endsAt ? new Date(b.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  } else {
    next.sort((a, b) => safeNum(b.popularityScore, 0) - safeNum(a.popularityScore, 0));
  }

  return next;
}

/* =========================
   CUSTOM SOLFORT CRYPTO MARKETS
========================= */

function getNextResolutionDate(minutes) {
  const now = new Date();
  const ms = minutes * 60 * 1000;
  return new Date(Math.ceil(now.getTime() / ms) * ms);
}

function buildCustomOutcome(probYes = 0.5) {
  const yesProb = Math.min(Math.max(probYes, 0.05), 0.95);
  const noProb = Number((1 - yesProb).toFixed(8));

  return [
    {
      name: "Yes",
      probability: Number(yesProb.toFixed(8)),
      payout: payoutFromProb(yesProb)
    },
    {
      name: "No",
      probability: noProb,
      payout: payoutFromProb(noProb)
    }
  ];
}

function getCustomSubcategoryByTimeframe(timeframeKey) {
  if (timeframeKey === "5m" || timeframeKey === "15m") return "Ultra Short";
  if (timeframeKey === "1h") return "Hourly";
  if (timeframeKey === "4h") return "4H";
  return "Daily";
}

function createBinaryUpDownMarket(symbol, timeframe) {
  const quote = generateQuote(symbol);
  const resolutionDate = getNextResolutionDate(timeframe.minutes);
  const lockDate = new Date(resolutionDate.getTime() - BET_LOCK_SECONDS * 1000);

  const driftSeed = safeNum(quote.changePercent, 0);
  const baseProb = 0.5 + Math.max(Math.min(driftSeed / 100, 0.12), -0.12);

  return {
    source: "solfort",
    externalId: `solfort-${symbol.toLowerCase()}-${timeframe.key}-updown`,
    slug: `${symbol.toLowerCase()}-${timeframe.key}-updown`,
    question: `Will ${symbol} close ${timeframe.label} higher than now?`,
    category: "Crypto",
    subcategory: getCustomSubcategoryByTimeframe(timeframe.key),
    marketType: "binary",
    outcomes: buildCustomOutcome(baseProb),
    volume: Math.round(5000 + Math.random() * 50000),
    endsAt: resolutionDate.toISOString(),
    lockAt: lockDate.toISOString(),
    lockSeconds: BET_LOCK_SECONDS,
    status: new Date() >= lockDate ? "locked" : "open",
    image: null,
    metadata: {
      symbol,
      timeframe: timeframe.key,
      resolutionType: "up-down",
      referenceSymbol: `${symbol}USDT`,
      lockRule: `Betting closes ${BET_LOCK_SECONDS} seconds before resolution`
    }
  };
}

function createAboveBelowMarket(symbol, timeframe) {
  const quote = generateQuote(symbol);
  const resolutionDate = getNextResolutionDate(timeframe.minutes);
  const lockDate = new Date(resolutionDate.getTime() - BET_LOCK_SECONDS * 1000);

  const current = safeNum(quote.last, 0);
  const digits = getDigits(symbol);

  const step =
    symbol === "BTC"
      ? 250
      : symbol === "ETH"
      ? 10
      : symbol === "SOL"
      ? 1
      : symbol === "XRP"
      ? 0.01
      : 1;

  const target = roundPrice(current + step, digits);
  const baseProb = 0.48 + Math.random() * 0.08;

  return {
    source: "solfort",
    externalId: `solfort-${symbol.toLowerCase()}-${timeframe.key}-above-${String(target).replace(".", "_")}`,
    slug: `${symbol.toLowerCase()}-${timeframe.key}-above-${String(target).replace(".", "-")}`,
    question: `Will ${symbol} settle above ${target} in ${timeframe.label}?`,
    category: "Crypto",
    subcategory: getCustomSubcategoryByTimeframe(timeframe.key),
    marketType: "binary",
    outcomes: buildCustomOutcome(baseProb),
    volume: Math.round(3000 + Math.random() * 30000),
    endsAt: resolutionDate.toISOString(),
    lockAt: lockDate.toISOString(),
    lockSeconds: BET_LOCK_SECONDS,
    status: new Date() >= lockDate ? "locked" : "open",
    image: null,
    metadata: {
      symbol,
      timeframe: timeframe.key,
      resolutionType: "above-below",
      targetPrice: target,
      referenceSymbol: `${symbol}USDT`,
      lockRule: `Betting closes ${BET_LOCK_SECONDS} seconds before resolution`
    }
  };
}

function generateCustomCryptoPredictionMarkets() {
  const rows = [];

  for (const symbol of CUSTOM_CRYPTO_SYMBOLS) {
    for (const timeframe of CUSTOM_CRYPTO_TIMEFRAMES) {
      rows.push(createBinaryUpDownMarket(symbol, timeframe));
      rows.push(createAboveBelowMarket(symbol, timeframe));
    }
  }

  return rows;
}

/* =========================
   PREDICTION FETCHERS
========================= */

async function fetchAllPolymarketMarkets() {
  let offset = 0;
  const pageSize = 100;
  let allRows = [];
  let keepGoing = true;

  while (keepGoing) {
    const url = `https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=${pageSize}&offset=${offset}`;
    const rows = await fetchJsonWithTimeout(url);

    if (!Array.isArray(rows) || rows.length === 0) {
      break;
    }

    allRows = allRows.concat(rows);

    if (allRows.length >= MAX_POLY_MARKETS) {
      allRows = allRows.slice(0, MAX_POLY_MARKETS);
      break;
    }

    if (rows.length < pageSize) {
      keepGoing = false;
    } else {
      offset += pageSize;
    }
  }

  return allRows.map((row) => {
    let outcomes = [];
    let prices = [];

    try {
      outcomes = JSON.parse(row.outcomes || "[]");
    } catch {}

    try {
      prices = JSON.parse(row.outcomePrices || "[]");
    } catch {}

    const mappedOutcomes = outcomes.map((name, idx) => {
      const prob = safeNum(prices[idx], 0);
      return {
        name,
        probability: prob,
        payout: payoutFromProb(prob)
      };
    });

    const tagNames = Array.isArray(row.tags)
      ? row.tags.map((t) => t?.label || t?.name).filter(Boolean)
      : [];

    const guessedCategory = normalizePredictionCategory(tagNames[0] || "Crypto");

    return {
      source: "polymarket",
      externalId: String(row.id),
      slug: row.slug || "",
      question: row.question || row.title || "",
      category: guessedCategory,
      subcategory: tagNames[1] || guessedCategory,
      marketType: mappedOutcomes.length > 2 ? "multi" : "binary",
      outcomes: mappedOutcomes,
      volume: safeNum(row.volume, 0),
      endsAt: row.endDate || row.end_date_iso || null,
      image: row.image || null
    };
  });
}

async function fetchKalshiEventsPage(cursor = "") {
  const base = "https://api.elections.kalshi.com/trade-api/v2/events";
  const qs = new URLSearchParams({
    limit: "100",
    with_nested_markets: "true"
  });

  if (cursor) {
    qs.set("cursor", cursor);
  }

  return fetchJsonWithTimeout(`${base}?${qs.toString()}`);
}

async function fetchAllKalshiEventsAndMarkets() {
  let cursor = "";
  let allEvents = [];
  let keepGoing = true;

  while (keepGoing) {
    const json = await fetchKalshiEventsPage(cursor);
    const events = json.events || json.data?.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      break;
    }

    allEvents = allEvents.concat(events);

    if (allEvents.length >= MAX_KALSHI_EVENTS) {
      allEvents = allEvents.slice(0, MAX_KALSHI_EVENTS);
      break;
    }

    const nextCursor = json.cursor || json.data?.cursor || "";
    if (!nextCursor) {
      keepGoing = false;
    } else {
      cursor = nextCursor;
    }
  }

  const markets = [];

  for (const event of allEvents) {
    const category = normalizePredictionCategory(
      event.category || event.series_ticker || event.series_title || "Global"
    );

    const eventMarkets = Array.isArray(event.markets) ? event.markets : [];

    for (const m of eventMarkets) {
      const yesProbRaw = safeNum(
        m.yes_ask ?? m.last_price ?? m.yes_bid ?? m.yes_price,
        0
      );

      const yesProb = yesProbRaw > 1 ? yesProbRaw / 100 : yesProbRaw;
      const noProb = Math.max(0, 1 - yesProb);

      markets.push({
        source: "kalshi",
        externalId: String(m.ticker || event.ticker || `${event.title}-${m.subtitle || "yesno"}`),
        slug: m.ticker || event.ticker || "",
        question: event.title || event.subtitle || event.ticker || "",
        category,
        subcategory: titleCase(event.series_ticker || category),
        marketType: "binary",
        outcomes: [
          {
            name: "Yes",
            probability: yesProb,
            payout: payoutFromProb(yesProb)
          },
          {
            name: "No",
            probability: noProb,
            payout: payoutFromProb(noProb)
          }
        ],
        volume: safeNum(m.volume, 0),
        endsAt: event.close_time || event.expiration_date || null,
        image: null
      });

      if (markets.length >= MAX_KALSHI_EVENTS) {
        break;
      }
    }

    if (markets.length >= MAX_KALSHI_EVENTS) {
      break;
    }
  }

  return markets;
}

async function refreshPredictionMarkets() {
  if (isPredictionRefreshing) {
    console.log("[prediction] refresh skipped (already running)");
    return;
  }

  isPredictionRefreshing = true;
  predictionCache.stats.lastRefreshStatus = "refreshing";
  predictionCache.stats.lastError = null;

  try {
    const [poly, kalshi] = await Promise.allSettled([
      fetchAllPolymarketMarkets(),
      fetchAllKalshiEventsAndMarkets()
    ]);

    const polyMarkets = poly.status === "fulfilled" ? poly.value : [];
    const kalshiMarkets = kalshi.status === "fulfilled" ? kalshi.value : [];
    const customMarkets = generateCustomCryptoPredictionMarkets();

    let merged = [...polyMarkets, ...kalshiMarkets, ...customMarkets];
    merged = sanitizePredictionMarkets(merged);
    merged = dedupePredictionMarkets(merged);
    merged = rankPredictionMarkets(merged);
    merged = merged
      .sort((a, b) => safeNum(b.popularityScore, 0) - safeNum(a.popularityScore, 0))
      .slice(0, MAX_TOTAL_PREDICTION_MARKETS);

    predictionCache.markets = merged;
    predictionCache.categories = buildPredictionCategories(merged);
    predictionCache.updatedAt = new Date().toISOString();
    predictionCache.stats = {
      lastRefreshStatus: "ok",
      lastError: null,
      polymarketCount: polyMarkets.length,
      kalshiCount: kalshiMarkets.length,
      customCount: customMarkets.length,
      totalMerged: merged.length
    };

    console.log(
      `[prediction] updated=${predictionCache.updatedAt} total=${merged.length} poly=${polyMarkets.length} kalshi=${kalshiMarkets.length} custom=${customMarkets.length}`
    );
  } catch (e) {
    predictionCache.stats.lastRefreshStatus = "failed";
    predictionCache.stats.lastError = String(e?.message || e);
    console.error("Prediction refresh failed:", e);
  } finally {
    isPredictionRefreshing = false;
  }
}

/* =========================
   HEALTH
========================= */

function getHealthChecks() {
  return {
    root: true,
    marketData: true,
    quotes: true,
    candles: true,
    newsService: true,
    salesSubmit: true,
    websocket: true,
    predictionAggregator: true
  };
}

/* =========================
   BASIC ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "SolFort API",
    startedAt: SERVER_STARTED_AT,
    now: new Date().toISOString()
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    checks: getHealthChecks(),
    startedAt: SERVER_STARTED_AT,
    now: new Date().toISOString()
  });
});

/* =========================
   SYMBOLS
========================= */

app.get("/symbols", (req, res) => {
  const category = String(req.query.category || "").trim().toUpperCase();

  let data = buildSymbolList();

  if (category) {
    data = data.filter((item) => item.category === category);
  }

  res.json({
    success: true,
    count: data.length,
    fetchedAt: new Date().toISOString(),
    data
  });
});

/* =========================
   QUOTES
========================= */

app.get("/quotes", (req, res) => {
  const symbol = ensureSymbol(req.query.symbol || "");

  if (!symbol) {
    return res.status(400).json({
      success: false,
      message: "valid symbol query is required"
    });
  }

  const quote = generateQuote(symbol);

  res.json({
    success: true,
    fetchedAt: new Date().toISOString(),
    data: quote
  });
});

/* =========================
   CANDLES
========================= */

app.get("/candles", (req, res) => {
  const symbol = ensureSymbol(req.query.symbol || "");
  const interval = String(req.query.interval || "15m");
  const limit = Math.min(Number(req.query.limit) || 200, 1000);

  if (!symbol) {
    return res.status(400).json({
      success: false,
      message: "valid symbol query is required"
    });
  }

  const data = generateCandles(symbol, interval, limit);

  res.json({
    success: true,
    symbol,
    interval,
    count: data.length,
    fetchedAt: new Date().toISOString(),
    data
  });
});

/* =========================
   MARKET DATA
========================= */

app.get("/market-data", (req, res) => {
  const requestedSymbol = ensureSymbol(req.query.symbol || "");

  let data = buildSymbolList().map((item) => ({
    symbol: `${item.symbol}-T`,
    normalizedSymbol: item.symbol,
    tradingViewSymbol: item.tradingViewSymbol,
    bid: item.bid,
    ask: item.ask,
    lastPrice: item.last,
    liveTradingPrice: item.last,
    spread: item.spread,
    changePercent: item.changePercent
  }));

  if (requestedSymbol) {
    data = data.filter((item) => item.normalizedSymbol === requestedSymbol);
  }

  res.json({
    success: true,
    count: data.length,
    fetchedAt: new Date().toISOString(),
    data
  });
});

/* =========================
   NEWS
========================= */

app.get("/news", async (req, res) => {
  try {
    const symbol = ensureSymbol(req.query.symbol || "");
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const region = ["all", "ko", "global"].includes(String(req.query.region || "all"))
      ? String(req.query.region || "all")
      : "all";
    const sort = String(req.query.sort || "latest") === "relevance" ? "relevance" : "latest";

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "valid symbol query is required"
      });
    }

    const result = await getNewsBySymbol(symbol, { limit, region, sort });

    const sentimentCounts = result.data.reduce(
      (acc, item) => {
        acc[item.sentiment] = (acc[item.sentiment] || 0) + 1;
        return acc;
      },
      { bullish: 0, bearish: 0, neutral: 0 }
    );

    res.json({
      success: true,
      symbol: result.symbol,
      region: result.region,
      sort,
      count: result.data.length,
      cache: result.cache,
      fetchedAt: new Date().toISOString(),
      sentimentCounts,
      data: result.data
    });
  } catch (error) {
    console.error("/news error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch news"
    });
  }
});

/* =========================
   SALES SUBMIT
========================= */

app.post("/sales/submit", (req, res) => {
  const {
    customerName,
    walletAddress,
    sales,
    quantity,
    price,
    promotion,
    sofAmount
  } = req.body;

  if (!customerName || !walletAddress) {
    return res.status(400).json({
      success: false,
      message: "customerName and walletAddress are required"
    });
  }

  const normalizedPayload = {
    customerName: String(customerName).trim(),
    walletAddress: String(walletAddress).trim(),
    sales: toNumber(sales),
    quantity: toNumber(quantity),
    price: toNumber(price),
    promotion: toNumber(promotion),
    sofAmount: toNumber(sofAmount),
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    data: normalizedPayload
  });
});

/* =========================
   PREDICTION ROUTES
========================= */

app.get("/prediction/health", (req, res) => {
  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    totalMarkets: predictionCache.markets.length,
    categories: predictionCache.categories,
    stats: predictionCache.stats
  });
});

app.get("/prediction/categories", (req, res) => {
  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    count: predictionCache.categories.length,
    data: predictionCache.categories
  });
});

app.get("/prediction/markets", (req, res) => {
  const {
    category = "",
    source = "",
    sort = "popular",
    limit = "100"
  } = req.query;

  const rows = sortPredictionMarkets(
    predictionCache.markets.filter((market) => {
      const categoryOk = !category || String(market.category).toLowerCase() === String(category).toLowerCase();
      const sourceOk = !source || String(market.source).toLowerCase() === String(source).toLowerCase();
      return categoryOk && sourceOk;
    }),
    sort
  ).slice(0, Math.max(1, Math.min(Number(limit) || 100, 1000)));

  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    count: rows.length,
    data: rows
  });
});

app.get("/prediction/top", (req, res) => {
  const highestOdds = sortPredictionMarkets(predictionCache.markets, "highest-odds").slice(0, 50);
  const mostPopular = sortPredictionMarkets(predictionCache.markets, "popular").slice(0, 50);
  const trending = sortPredictionMarkets(predictionCache.markets, "trending").slice(0, 50);
  const endingSoon = sortPredictionMarkets(predictionCache.markets, "ending-soon").slice(0, 50);

  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    data: {
      highestOdds,
      mostPopular,
      trending,
      endingSoon
    }
  });
});

app.get("/prediction/market/:source/:id", (req, res) => {
  const { source, id } = req.params;

  const market = predictionCache.markets.find(
    (m) => m.source === source && String(m.externalId) === String(id)
  );

  if (!market) {
    return res.status(404).json({
      success: false,
      message: "Market not found"
    });
  }

  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    data: market
  });
});

/* =========================
   WEBSOCKET STREAM
========================= */

function sendJson(ws, payload) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function parseStreamSymbols(url) {
  try {
    const parsed = new URL(url, "http://localhost");
    const symbolsParam = parsed.searchParams.get("symbols") || parsed.searchParams.get("symbol") || "";
    const normalized = symbolsParam
      .split(",")
      .map((s) => ensureSymbol(s))
      .filter(Boolean);

    return normalized.length > 0 ? normalized : ["EURUSD"];
  } catch {
    return ["EURUSD"];
  }
}

wss.on("connection", (ws, req) => {
  const subscribedSymbols = parseStreamSymbols(req.url);

  sendJson(ws, {
    type: "connected",
    success: true,
    subscribedSymbols,
    connectedAt: new Date().toISOString()
  });

  const timer = setInterval(() => {
    for (const symbol of subscribedSymbols) {
      const quote = generateQuote(symbol);

      sendJson(ws, {
        type: "quote",
        symbol,
        data: quote
      });
    }
  }, STREAM_INTERVAL_MS);

  ws.on("close", () => {
    clearInterval(timer);
  });

  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(String(message));

      if (parsed?.type === "subscribe" && Array.isArray(parsed.symbols)) {
        const nextSymbols = parsed.symbols
          .map((s) => ensureSymbol(s))
          .filter(Boolean);

        if (nextSymbols.length > 0) {
          subscribedSymbols.length = 0;
          subscribedSymbols.push(...nextSymbols);

          sendJson(ws, {
            type: "subscribed",
            success: true,
            subscribedSymbols,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch {
      // ignore malformed messages
    }
  });
});

/* =========================
   STARTUP
========================= */

refreshPredictionMarkets().catch((e) => {
  console.error("Initial prediction refresh failed:", e);
});

setInterval(() => {
  refreshPredictionMarkets().catch((e) => {
    console.error("Prediction refresh failed:", e);
  });
}, PREDICTION_REFRESH_MS);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 SolFort Server Running on ${PORT}`);
});
