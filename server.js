// server.js (FULL VERSION - SOLFORT PRE-DB MARKET ENGINE + PREDICTION AGGREGATOR)

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

const STREAM_INTERVAL_MS = 1500;

/* =========================
   PREDICTION AGGREGATOR CONFIG
========================= */

const PREDICTION_REFRESH_MS = 60 * 1000;

const predictionCache = {
  updatedAt: null,
  markets: [],
  categories: []
};

/* =========================
   UTILS
========================= */

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

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

function roundPrice(value, digits = 2) {
  return Number(Number(value).toFixed(digits));
}

function getDigits(symbol) {
  return SYMBOL_CONFIG[symbol]?.digits ?? 2;
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function payoutFromProb(prob) {
  const p = safeNum(prob, 0);
  if (p <= 0) return null;
  return Number((1 / p).toFixed(2));
}

function titleCase(s) {
  return String(s || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function normalizePredictionCategory(input) {
  const raw = String(input || "").trim().toLowerCase();

  const map = {
    trending: "Trending",
    elections: "Elections",
    politics: "Politics",
    sports: "Sports",
    culture: "Culture",
    crypto: "Crypto",
    climate: "Climate",
    economy: "Economics",
    economics: "Economics",
    mentions: "Global",
    companies: "Companies",
    company: "Companies",
    financials: "Financials",
    finance: "Financials",
    tech: "Tech & Science",
    technology: "Tech & Science",
    science: "Tech & Science",
    global: "Global"
  };

  return map[raw] || titleCase(raw || "Global");
}

function buildPredictionCategories(markets) {
  const set = new Set();
  for (const market of markets) {
    if (market.category) set.add(market.category);
  }
  return Array.from(set);
}

function rankPredictionMarkets(markets) {
  return markets.map((m) => {
    const volume = safeNum(m.volume, 0);
    const highestPayout = Math.max(
      ...((m.outcomes || []).map((o) => safeNum(o.payout, 0)).length
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

function generateQuote(symbol) {
  const config = SYMBOL_CONFIG[symbol];
  const now = Date.now();
  const timeFactor = now / 1000;

  const noise = (pseudoRandom(timeFactor + config.basePrice) - 0.5);
  const trend = Math.sin(timeFactor / 60) * 0.001;
  const volatilityFactor =
    symbol === "BTC" || symbol === "ETH" || symbol === "SOL" || symbol === "XRP"
      ? config.basePrice * 0.0025
      : config.basePrice * 0.00035;

  const move = (noise * volatilityFactor) + (trend * config.basePrice);
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
    const time = now - (i * intervalMs);
    const factorA = Math.sin(time / 300000);
    const factorB = Math.cos(time / 900000);
    const volatility =
      symbol === "BTC" || symbol === "ETH" || symbol === "SOL" || symbol === "XRP"
        ? config.basePrice * 0.004
        : config.basePrice * 0.0008;

    const drift = (factorA + factorB) * volatility * 0.25;
    const open = previousClose;
    const close = open + drift + ((pseudoRandom(time) - 0.5) * volatility * 0.35);

    const highBase = Math.max(open, close);
    const lowBase = Math.min(open, close);

    const high = highBase + (pseudoRandom(time + 1) * volatility * 0.2);
    const low = lowBase - (pseudoRandom(time + 2) * volatility * 0.2);

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
   PREDICTION AGGREGATOR
========================= */

async function fetchPolymarketMarkets() {
  const url = "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=200";
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Polymarket fetch failed: ${res.status}`);
  }

  const rows = await res.json();

  return rows.map((row) => {
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

async function fetchKalshiEventsAndMarkets() {
  const endpoints = [
    "https://api.elections.kalshi.com/trade-api/v2/events?limit=200",
    "https://api.elections.kalshi.com/trade-api/v2/events?status=open&limit=200"
  ];

  let json = null;

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      json = await res.json();
      if (json) break;
    } catch {
      // try next endpoint
    }
  }

  if (!json) {
    throw new Error("Kalshi fetch failed");
  }

  const events = json.events || json.data?.events || [];
  const markets = [];

  for (const event of events) {
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
    }
  }

  return markets;
}

async function refreshPredictionMarkets() {
  const [poly, kalshi] = await Promise.allSettled([
    fetchPolymarketMarkets(),
    fetchKalshiEventsAndMarkets()
  ]);

  const merged = [
    ...(poly.status === "fulfilled" ? poly.value : []),
    ...(kalshi.status === "fulfilled" ? kalshi.value : [])
  ];

  const ranked = rankPredictionMarkets(merged);

  predictionCache.markets = ranked;
  predictionCache.categories = buildPredictionCategories(ranked);
  predictionCache.updatedAt = new Date().toISOString();
}

function filterPredictionMarkets({ category, source, sort }) {
  let rows = [...predictionCache.markets];

  if (category) {
    rows = rows.filter(
      (m) => String(m.category).toLowerCase() === String(category).toLowerCase()
    );
  }

  if (source) {
    rows = rows.filter(
      (m) => String(m.source).toLowerCase() === String(source).toLowerCase()
    );
  }

  if (sort === "highest-odds") {
    rows.sort((a, b) => safeNum(b.highestPayout, 0) - safeNum(a.highestPayout, 0));
  } else if (sort === "popular") {
    rows.sort((a, b) => safeNum(b.popularityScore, 0) - safeNum(a.popularityScore, 0));
  } else if (sort === "trending") {
    rows.sort((a, b) => safeNum(b.trendingScore, 0) - safeNum(a.trendingScore, 0));
  } else {
    rows.sort((a, b) => safeNum(b.popularityScore, 0) - safeNum(a.popularityScore, 0));
  }

  return rows;
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
   PREDICTION MARKET ROUTES
========================= */

app.get("/prediction/health", (req, res) => {
  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    totalMarkets: predictionCache.markets.length,
    categories: predictionCache.categories
  });
});

app.get("/prediction/categories", (req, res) => {
  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
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

  const rows = filterPredictionMarkets({ category, source, sort }).slice(
    0,
    Math.max(1, Math.min(Number(limit) || 100, 500))
  );

  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    count: rows.length,
    data: rows
  });
});

app.get("/prediction/top", (req, res) => {
  const highestOdds = filterPredictionMarkets({ sort: "highest-odds" }).slice(0, 20);
  const mostPopular = filterPredictionMarkets({ sort: "popular" }).slice(0, 20);
  const trending = filterPredictionMarkets({ sort: "trending" }).slice(0, 20);

  res.json({
    success: true,
    updatedAt: predictionCache.updatedAt,
    data: {
      highestOdds,
      mostPopular,
      trending
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
