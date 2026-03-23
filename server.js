// server.js (FULL VERSION - SOLFORT PRE-DB UPGRADE)

const express = require("express");
const cors = require("cors");
const { getNewsBySymbol } = require("./services/newsService");

const app = express();

app.use(cors());
app.use(express.json());

const SERVER_STARTED_AT = new Date().toISOString();

/* =========================
   유틸
========================= */

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pick(...vals) {
  for (const v of vals) {
    const n = toNumber(v);
    if (n && n > 0) return n;
  }
  return null;
}

function normalizeSymbol(input) {
  if (!input) return "";

  let raw = String(input)
    .trim()
    .toUpperCase()
    .replace(/_/g, "-")
    .replace(/\//g, "-");

  const parts = raw.split("-").filter(Boolean);
  const ignore = ["PERP", "USDT", "USDC", "USD"];

  const base = parts.find((p) => !ignore.includes(p));
  return base || parts[0] || raw;
}

function resolveTradingPrice(s) {
  if (!s) return null;

  return pick(
    s.liveTradingPrice,
    s.markPrice,
    s.lastPrice,
    s.price,
    s.tradePrice,
    s.close,
    s.indexPrice
  );
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

app.get("/health", async (req, res) => {
  const checks = {
    root: true,
    marketData: true,
    newsService: true,
    salesSubmit: true
  };

  res.json({
    success: true,
    status: "healthy",
    checks,
    startedAt: SERVER_STARTED_AT,
    now: new Date().toISOString()
  });
});

/* =========================
   MARKET DATA
========================= */

app.get("/market-data", (req, res) => {
  const requestedSymbol = normalizeSymbol(req.query.symbol || "");

  const raw = [
    {
      symbol: "ETH-PERP",
      markPrice: "3824.17",
      lastPrice: "3823.90",
      indexPrice: "3824.01"
    },
    {
      symbol: "BTC-PERP",
      markPrice: "118220.2",
      lastPrice: "118210.8",
      indexPrice: "118215.5"
    },
    {
      symbol: "SOL-PERP",
      markPrice: "191.22",
      lastPrice: "191.18",
      indexPrice: "191.11"
    },
    {
      symbol: "XRP-PERP",
      markPrice: "1.447",
      lastPrice: "1.444",
      indexPrice: "1.445"
    }
  ];

  let data = raw.map((item) => ({
    symbol: item.symbol,
    normalizedSymbol: normalizeSymbol(item.symbol),
    markPrice: toNumber(item.markPrice),
    lastPrice: toNumber(item.lastPrice),
    indexPrice: toNumber(item.indexPrice),
    liveTradingPrice: resolveTradingPrice(item)
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
   Examples:
   /news?symbol=BTC
   /news?symbol=ETH&limit=10
   /news?symbol=SOL&region=ko
   /news?symbol=XRP&sort=relevance
========================= */

app.get("/news", async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.query.symbol || "");
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const region = ["all", "ko", "global"].includes(String(req.query.region || "all"))
      ? String(req.query.region || "all")
      : "all";
    const sort = String(req.query.sort || "latest") === "relevance" ? "relevance" : "latest";

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "symbol query is required"
      });
    }

    const result = await getNewsBySymbol(symbol, {
      limit,
      region,
      sort
    });

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

/* ========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SolFort Server Running on ${PORT}`);
});
