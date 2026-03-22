const fs = require("fs");
const path = require("path");

let aliasCache = null;
let pairsCache = null;

function loadAliasMap() {
  if (aliasCache) return aliasCache;
  const filePath = path.join(__dirname, "..", "data", "symbol_alias_map.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  aliasCache = JSON.parse(raw);
  return aliasCache;
}

function loadTradingPairs() {
  if (pairsCache) return pairsCache;
  const filePath = path.join(__dirname, "..", "data", "trading_pairs.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  pairsCache = JSON.parse(raw);
  return pairsCache;
}

function resolveSymbol(symbol) {
  const aliasMap = loadAliasMap();
  return aliasMap[symbol] || null;
}

function getAllTradingPairs() {
  return loadTradingPairs();
}

function toOrderlySymbol(symbol) {
  const resolved = resolveSymbol(symbol);
  return resolved?.orderly || null;
}

function toDisplaySymbol(symbol) {
  const resolved = resolveSymbol(symbol);
  return resolved?.display || symbol;
}

function toBaseSymbol(symbol) {
  const resolved = resolveSymbol(symbol);
  return resolved?.base || symbol.split("-")[0].toUpperCase();
}

module.exports = {
  resolveSymbol,
  getAllTradingPairs,
  toOrderlySymbol,
  toDisplaySymbol,
  toBaseSymbol
};
