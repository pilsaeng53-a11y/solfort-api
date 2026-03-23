import React from "react";
import { useFuturesCandles } from "../../hooks/useFuturesCandles";

export default function CandleDebugPanel({ selectedSymbol, interval = "15m" }) {
  const { candles, loading, error } = useFuturesCandles(selectedSymbol, interval, 50);

  return (
    <div className="p-3 text-xs text-white/70">
      <div>loading: {String(loading)}</div>
      <div>error: {error || "-"}</div>
      <div>candles: {candles.length}</div>
      <pre className="mt-2 overflow-auto max-h-[200px]">
        {JSON.stringify(candles.slice(-3), null, 2)}
      </pre>
    </div>
  );
}
