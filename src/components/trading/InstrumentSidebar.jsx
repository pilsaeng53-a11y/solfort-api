import React from "react";
import { useFuturesSymbols } from "../../hooks/useFuturesSymbols";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";
import { usePriceStream } from "../../hooks/usePriceStream";

function formatPrice(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getDigits(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 5;
  if (symbol === "USDJPY") return 3;
  if (symbol === "XRP") return 4;
  return 2;
}

export default function InstrumentSidebar({ category = "", selectedSymbol, onSelect }) {
  const { symbols, loading } = useFuturesSymbols(category);

  const streamSymbols = symbols.map((item) => item.symbol);
  const { quotesMap } = usePriceStream(streamSymbols);

  return (
    <div className="h-full overflow-y-auto p-2">
      {loading && <div className="text-white/50 text-sm">Loading...</div>}

      <div className="space-y-2">
        {symbols.map((item) => {
          const normalized = normalizeSymbol(item.symbol);
          const live = quotesMap[normalized];
          const active = normalizeSymbol(selectedSymbol) === normalized;
          const digits = getDigits(normalized);

          return (
            <button
              key={item.symbol}
              onClick={() => onSelect?.(`${normalized}-T`)}
              className={`w-full text-left rounded-xl px-3 py-3 border ${
                active
                  ? "border-emerald-400 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="text-white font-semibold">{item.symbol}</div>
                <div className="text-white">
                  {formatPrice(live?.last ?? item.last, digits)}
                </div>
              </div>

              <div className="flex items-center justify-between mt-1 text-xs text-white/50">
                <span>{item.displayName}</span>
                <span className={(live?.changePercent ?? item.changePercent) >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {(live?.changePercent ?? item.changePercent) != null
                    ? `${live?.changePercent ?? item.changePercent}%`
                    : "-"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
