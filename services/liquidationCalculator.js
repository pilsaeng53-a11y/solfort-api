function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function estimateLiquidationPrice({
  entryPrice,
  leverage,
  side = "LONG",
  maintenanceMarginRate = 0.005
}) {
  const entry = safeNumber(entryPrice);
  const lev = safeNumber(leverage, 1);

  if (entry <= 0 || lev <= 0) return null;

  const moveFraction = (1 / lev) - maintenanceMarginRate;

  if (side === "LONG") {
    return entry * (1 - moveFraction);
  }

  return entry * (1 + moveFraction);
}

function calculateLiqDistance({ markPrice, liquidationPrice }) {
  const mark = safeNumber(markPrice);
  const liq = safeNumber(liquidationPrice);

  if (mark <= 0 || liq <= 0) {
    return {
      priceDiff: null,
      percentDiff: null
    };
  }

  const diff = Math.abs(mark - liq);
  const percent = (diff / mark) * 100;

  return {
    priceDiff: diff,
    percentDiff: percent
  };
}

function resolveRiskBadge(percentDiff) {
  const pct = safeNumber(percentDiff, 999);

  if (pct <= 3) return "DANGER";
  if (pct <= 8) return "WARNING";
  return "SAFE";
}

module.exports = {
  estimateLiquidationPrice,
  calculateLiqDistance,
  resolveRiskBadge
};
