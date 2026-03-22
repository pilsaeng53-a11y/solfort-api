function isValidLeverage(value, min = 1, max = 100) {
  const lev = Number(value);
  return Number.isFinite(lev) && lev >= min && lev <= max;
}

function isValidAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0;
}

function hasSufficientBalance({ requiredMargin, availableBalance }) {
  const req = Number(requiredMargin);
  const avail = Number(availableBalance);

  if (!Number.isFinite(req) || !Number.isFinite(avail)) return false;
  return avail >= req;
}

module.exports = {
  isValidLeverage,
  isValidAmount,
  hasSufficientBalance
};
