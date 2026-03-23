// src/utils/tradingSymbolMapper.js

export function normalizeSymbol(input) {
  if (!input) return "";

  let raw = String(input).trim().toUpperCase();
  raw = raw.replace(/\//g, "-").replace(/_/g, "-");

  const parts = raw.split("-").filter(Boolean);
  const ignore = ["PERP", "USDT", "USDC", "USD", "T"];

  const base = parts.find((p) => !ignore.includes(p));
  return base || parts[0] || raw;
}

export function toTradingViewSymbol(input) {
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
    SP500: "OANDA:SPX500USD",
  };

  return map[symbol] || symbol;
}
