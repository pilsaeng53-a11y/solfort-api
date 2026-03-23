// server.js (FULL VERSION - SOLFORT)

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   공용 유틸
========================= */

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function pickFirstValid(...values) {
  for (const v of values) {
    const n = toNumber(v);
    if (n !== null && n > 0) return n;
  }
  return null;
}

function normalizeSymbol(input) {
  if (!input) return "";

  let raw = String(input).trim().toUpperCase();
  raw = raw.replace(/\s+/g, "");
  raw = raw.replace(/\//g, "-");
  raw = raw.replace(/_/g, "-");

  const KNOWN_QUOTES = ["USDT", "USDC", "USD", "PERP", "BUSD", "BTC", "ETH"];

  const parts = raw.split("-").filter(Boolean);

  if (parts.length === 1) return raw;

  const filtered = parts.filter((p) => p !== "PERP");
  const base = filtered.find((p) => !KNOWN_QUOTES.includes(p));

  return base || filtered[0] || parts[0];
}

function resolveTradingPrice(source) {
  if (!source) return null;

  return pickFirstValid(
    source.markPrice,
    source.mark_price,

    source.lastPrice,
    source.last_price,
    source.price,
    source.tradePrice,
    source.trade_price,
    source.close,
    source.closePrice,

    source.indexPrice,
    source.index_price
  );
}

/* =========================
   기본 라우트
========================= */

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "SolFort API",
  });
});

/* =========================
   MARKET DATA (핵심)
========================= */

app.get("/market-data", async (req, res) => {
  try {
    // TODO: 실제 거래소 API로 교체
    const raw = [
      {
        symbol: "ETH-PERP",
        markPrice: "3824.17",
        lastPrice: "3823.90",
        indexPrice: "3824.01",
        marketCap: "999999999", // ❌ 절대 사용 금지
      },
      {
        symbol: "BTC-PERP",
        markPrice: "118220.2",
        lastPrice: "118210.8",
        indexPrice: "118215.5",
        marketCap: "999999999",
      },
    ];

    const data = raw.map((item) => ({
      symbol: item.symbol,
      normalizedSymbol: normalizeSymbol(item.symbol),

      markPrice: item.markPrice,
      lastPrice: item.lastPrice,
      indexPrice: item.indexPrice,

      // ✅ 핵심
      liveTradingPrice: resolveTradingPrice(item),
    }));

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "market data error",
    });
  }
});

/* =========================
   SALES SUBMIT
========================= */

app.post("/sales/submit", async (req, res) => {
  try {
    const {
      customerName,
      walletAddress,
      sales,
      quantity,
      price,
      promotion,
      sofAmount,
    } = req.body;

    if (!customerName || !walletAddress) {
      return res.status(400).json({
        success: false,
        message: "필수값 누락",
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
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
    });
  }
});

/* ========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SolFort Server Running on ${PORT}`);
});
