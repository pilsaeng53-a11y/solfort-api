// src/services/candlesService.js

import { apiGet } from "./apiClient";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

export async function fetchCandles(symbol, interval = "15m", limit = 200) {
  const normalizedSymbol = normalizeSymbol(symbol);

  const json = await apiGet(
    `/candles?symbol=${encodeURIComponent(normalizedSymbol)}&interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(limit)}`
  );

  return Array.isArray(json?.data) ? json.data : [];
}
