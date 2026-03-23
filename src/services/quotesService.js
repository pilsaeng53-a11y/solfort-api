// src/services/quotesService.js

import { apiGet } from "./apiClient";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

export async function fetchQuote(symbol) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const json = await apiGet(`/quotes?symbol=${encodeURIComponent(normalizedSymbol)}`);

  return json?.data || null;
}
