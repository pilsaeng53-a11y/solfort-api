// src/components/trading/DepthOfMarket.jsx

import React, { useMemo } from "react";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";

function formatPrice(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString(undefined, {
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

function getTick(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 0.00001;
  if (symbol === "USDJPY") return 0.001;
  if (symbol === "XRP") return 0.0001;
  return 0.01;
}

export default function DepthOfMarket({ selectedSymbol }) {
  const { quote } = useFuturesQuote(selectedSymbol);
  const normalizedSymbol = normalizeSymbol(selectedSymbol);
  const digits = getDigits(normalizedSymbol);
  const tick = getTick(normalizedSymbol);

  const { bids, asks } = useMemo(() => {
    const bidBase = Number(quote?.bid || 0);
    const askBase = Number(quote?.ask || 0);

    if (!bidBase || !askBase) {
      return { bids: [], asks: [] };
    }

    const bidRows = Array.from({ length: 8 }).map((_, idx) => {
      const price = bidBase - tick * idx;
      const size = Math.round(50 + Math.random() * 950);
      return { price, size };
    });

    const askRows = Array.from({ length: 8 }).map((_, idx) => {
      const price = askBase + tick * idx;
      const size = Math.round(50 + Math.random() * 950);
      return { price, size };
    });

    return { bids: bidRows, asks: askRows.reverse() };
  }, [quote?.bid, quote?.ask, tick]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020] overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <div className="text-white font-semibold">Market Depth</div>
        <div className="text-xs text-white/50">{normalizedSymbol}</div>
      </div>

      <div className="grid grid-cols-2 text-xs text-white/50 px-4 py-2 border-b border-white/10">
        <div>Bid</div>
        <div className="text-right">Ask</div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 py-3">
        <div className="space-y-1">
          {bids.map((row, idx) => (
            <div
              key={`bid-${idx}`}
              className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2 py-1"
            >
              <span className="text-emerald-400">{formatPrice(row.price, digits)}</span>
              <span className="text-white/70">{row.size}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {asks.map((row, idx) => (
            <div
              key={`ask-${idx}`}
              className="flex items-center justify-between rounded-lg bg-red-500/10 px-2 py-1"
            >
              <span className="text-white/70">{row.size}</span>
              <span className="text-red-400">{formatPrice(row.price, digits)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
