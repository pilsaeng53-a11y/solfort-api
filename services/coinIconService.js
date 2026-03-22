const fs = require("fs");
const path = require("path");

let iconMapCache = null;

function loadIconMap() {
  if (iconMapCache) return iconMapCache;

  const filePath = path.join(__dirname, "..", "data", "coin_icon_map.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  iconMapCache = JSON.parse(raw);
  return iconMapCache;
}

function getBaseSymbol(symbol = "") {
  if (!symbol) return "";

  if (symbol.startsWith("PERP_")) {
    return symbol.replace("PERP_", "").split("_")[0].toUpperCase();
  }

  return symbol.split("-")[0].toUpperCase();
}

function getCoinIcon(symbol = "") {
  const iconMap = loadIconMap();
  const base = getBaseSymbol(symbol);
  return iconMap[base] || "/icons/fallback-coin.png";
}

module.exports = {
  loadIconMap,
  getBaseSymbol,
  getCoinIcon
};
