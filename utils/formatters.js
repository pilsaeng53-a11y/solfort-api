function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString();
}

function formatPercent(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
}

function formatUsd(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatTimestamp(ts) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

module.exports = {
  formatPrice,
  formatPercent,
  formatUsd,
  formatTimestamp
};
