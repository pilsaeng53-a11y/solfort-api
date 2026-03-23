import React from "react";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";

function formatPrice(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function OrderPanel({ selectedSymbol }) {
  const { quote, loading } = useFuturesQuote(selectedSymbol);
  const normalizedSymbol = normalizeSymbol(selectedSymbol);

  const digits =
    normalizedSymbol === "EURUSD" ||
    normalizedSymbol === "GBPUSD" ||
    normalizedSymbol === "AUDUSD"
      ? 5
      : normalizedSymbol === "USDJPY"
      ? 3
      : normalizedSymbol === "XRP"
      ? 4
      : 2;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-xs text-white/50">Selected Market</div>
        <div className="text-white font-semibold">{normalizedSymbol}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <button className="rounded-xl bg-emerald-500/90 hover:bg-emerald-500 text-white py-4 font-bold">
          {loading ? "..." : `${formatPrice(quote?.ask, digits)} BUY`}
        </button>
        <button className="rounded-xl bg-slate-700 hover:bg-slate-600 text-white py-4 font-bold">
          {loading ? "..." : `${formatPrice(quote?.bid, digits)} SELL`}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-white/70">
          <span>Last</span>
          <span>{formatPrice(quote?.last, digits)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Spread</span>
          <span>{formatPrice(quote?.spread, digits)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Change</span>
          <span>{quote?.changePercent != null ? `${quote.changePercent}%` : "-"}</span>
        </div>
      </div>
    </div>
  );
}
