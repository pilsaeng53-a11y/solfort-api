import React from "react";
import CoinIcon from "../CoinIcon";
import { useSelectedTradingInstrument } from "../../hooks/useSelectedTradingInstrument";

export default function TradeHeader({ selectedSymbol, currentPrice, changePercent }) {
  const { rawSymbol, normalizedSymbol } = useSelectedTradingInstrument(selectedSymbol);

  return (
    <div className="flex items-center justify-between p-3 border-b border-white/10">
      <div className="flex items-center gap-3">
        <CoinIcon symbol={normalizedSymbol} size={28} />
        <div>
          <div className="text-white font-semibold">{rawSymbol}</div>
          <div className="text-xs text-white/50">{normalizedSymbol}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-emerald-400 text-2xl font-bold">
          {currentPrice ?? "-"}
        </div>
        <div className="text-sm text-emerald-400">
          {changePercent ?? "-"}
        </div>
      </div>
    </div>
  );
}
