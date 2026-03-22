function safeNumber(value, fallback = 0) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function calculateEstimatedTotal({ price, amount, mode = "BASE" }) {
  const p = safeNumber(price);
  const a = safeNumber(amount);

  if (mode === "QUOTE") return a;
  if (mode === "BASE") return p * a;
  return 0;
}

function calculateEstimatedQuantity({ price, amount, mode = "BASE" }) {
  const p = safeNumber(price);
  const a = safeNumber(amount);

  if (mode === "BASE") return a;
  if (mode === "QUOTE" && p > 0) return a / p;
  return 0;
}

function calculateMarginUsed({ totalValue, leverage }) {
  const total = safeNumber(totalValue);
  const lev = safeNumber(leverage, 1);
  if (lev <= 0) return 0;
  return total / lev;
}

function calculateFromPercentage({
  availableBalance,
  percentage,
  leverage,
  price,
  mode = "QUOTE"
}) {
  const balance = safeNumber(availableBalance);
  const pct = safeNumber(percentage) / 100;
  const lev = safeNumber(leverage, 1);
  const p = safeNumber(price);

  const allocatedBalance = balance * pct;
  const quoteValue = allocatedBalance * lev;

  if (mode === "QUOTE") {
    return {
      amount: quoteValue,
      estimatedQuantity: p > 0 ? quoteValue / p : 0,
      estimatedTotal: quoteValue
    };
  }

  if (mode === "BASE") {
    const qty = p > 0 ? quoteValue / p : 0;
    return {
      amount: qty,
      estimatedQuantity: qty,
      estimatedTotal: quoteValue
    };
  }

  return {
    amount: 0,
    estimatedQuantity: 0,
    estimatedTotal: 0
  };
}

module.exports = {
  calculateEstimatedTotal,
  calculateEstimatedQuantity,
  calculateMarginUsed,
  calculateFromPercentage
};
