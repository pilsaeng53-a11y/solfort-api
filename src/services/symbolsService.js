// src/services/symbolsService.js

import { apiGet } from "./apiClient";

export async function fetchSymbols(category = "") {
  const suffix = category
    ? `?category=${encodeURIComponent(String(category).toUpperCase())}`
    : "";

  const json = await apiGet(`/symbols${suffix}`);
  return Array.isArray(json?.data) ? json.data : [];
}
