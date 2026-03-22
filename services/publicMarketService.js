const fetch = require("node-fetch");
const { toOrderlySymbol } = require("./symbolResolver");

const ORDERLY_REST_BASE = "https://api.orderly.org";

async function fetchTicker(symbol) {
  const orderlySymbol = toOrderlySymbol(symbol);
  if (!orderlySymbol) throw new Error("Invalid symbol mapping");

  const res = await fetch(`${ORDERLY_REST_BASE}/v1/public/futures/${orderlySymbol}`);
  if (!res.ok) throw new Error(`Ticker fetch failed: ${res.status}`);
  return res.json();
}

async function fetchOpenInterests() {
  const res = await fetch(`${ORDERLY_REST_BASE}/v1/public/market_info/traders_open_interests`);
  if (!res.ok) throw new Error(`OI fetch failed: ${res.status}`);
  return res.json();
}

async function fetchMarketInfo() {
  const res = await fetch(`${ORDERLY_REST_BASE}/v1/public/info`);
  if (!res.ok) throw new Error(`Market info fetch failed: ${res.status}`);
  return res.json();
}

module.exports = {
  fetchTicker,
  fetchOpenInterests,
  fetchMarketInfo
};
