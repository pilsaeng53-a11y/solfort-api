import React, { useState } from "react";
import BackendCandleChart from "./BackendCandleChart";

const intervals = ["1m", "5m", "15m", "30m", "1h", "4h", "1d"];

export default function TradingChart({ selectedSymbol }) {
  const [interval, setInterval] = useState("15m");

  return (
    <div className="w-full h-full flex flex-col gap-3">
      <div className="flex items-center gap-2 px-2">
        {intervals.map((item) => (
          <button
            key={item}
            onClick={() => setInterval(item)}
            className={`px-3 py-1.5 rounded-lg text-sm border ${
              interval === item
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-400/50"
                : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <BackendCandleChart
        selectedSymbol={selectedSymbol}
        interval={interval}
        height={520}
      />
    </div>
  );
}
