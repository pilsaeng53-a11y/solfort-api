// server.js (FULL VERSION - SOLFORT + NEWS)

const express = require("express");
const cors = require("cors");
const { getNewsBySymbol } = require("./services/newsService");

const app = express();

app.use(cors());
app.use(express.json());

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
    .toUpperCase()
    .replace(/_/g, "-")
    .replace(/\//g, "-");

  const parts = raw.split("-");
  const ignore = ["PERP", "USDT", "USDC", "USD"];

  const base = parts.find((p) => !ignore.includes(p));
  return base || parts[0];
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
   ROUTES
========================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "SolFort API"
  });
});

/* =========================
   MARKET DATA
========================= */

app.get("/market-data", (req, res) => {
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

  const data = raw.map((item) => ({
    symbol: item.symbol,
    normalizedSymbol: normalizeSymbol(item.symbol),
    liveTradingPrice: resolveTradingPrice(item)
  }));

  res.json({
    success: true,
    data
  });
});

/* =========================
   NEWS
   Example:
   /news?symbol=BTC
   /news?symbol=ETH&limit=10
========================= */

app.get("/news", async (req, res) => {
  try {
    const symbol = normalizeSymbol(req.query.symbol || "");
    const limit = Math.min(Number(req.query.limit) || 20, 50);

    if (!symbol) {
      return res.status(400).json({
        success: false,
        message: "symbol query is required"
      });
    }

    const articles = await getNewsBySymbol(symbol, limit);

    res.json({
      success: true,
      symbol,
      count: articles.length,
      data: articles
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
      message: "필수값 누락"
    });
  }

  res.json({
    success: true,
    data: {
      customerName,
      walletAddress,
      sales,
      quantity,
      price,
      promotion,
      sofAmount,
      createdAt: new Date().toISOString()
    }
  });
});

/* ========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SolFort Server Running on ${PORT}`);
});
