import React from "react";
import CoinIcon from "../CoinIcon";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";

function formatPrice(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function TradeHeader({ selectedSymbol }) {
  const { quote, connectionState } = useFuturesQuote(selectedSymbol);
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
    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <CoinIcon symbol={normalizedSymbol} size={28} />
        <div>
          <div className="text-white font-semibold">{selectedSymbol}</div>
          <div className="text-xs text-white/50">{normalizedSymbol}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-emerald-400 text-2xl font-bold">
          {formatPrice(quote?.last, digits)}
        </div>
        <div className="text-sm text-emerald-400">
          {quote?.changePercent != null ? `${quote.changePercent}%` : "-"}
        </div>
        <div className="text-[11px] text-white/40 mt-1">
          {connectionState}
        </div>
      </div>
    </div>
  );
}
