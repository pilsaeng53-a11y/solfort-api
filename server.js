const express = require("express");
const cors = require("cors");

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

  let raw = input.toUpperCase()
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
  res.json({ ok: true, service: "SolFort API" });
});

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
    }
  ];

  const data = raw.map((item) => ({
    symbol: item.symbol,
    normalizedSymbol: normalizeSymbol(item.symbol),
    liveTradingPrice: resolveTradingPrice(item)
  }));

  res.json({ success: true, data });
});

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
