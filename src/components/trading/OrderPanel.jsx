import React from "react";
import { useSelectedTradingInstrument } from "../../hooks/useSelectedTradingInstrument";

export default function OrderPanel({ selectedSymbol, currentPrice, spread }) {
  const { normalizedSymbol } = useSelectedTradingInstrument(selectedSymbol);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-xs text-white/50">Selected Market</div>
        <div className="text-white font-semibold">{normalizedSymbol}</div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-white/50">Current Price</div>
        <div className="text-white text-xl font-bold">{currentPrice ?? "-"}</div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-white/50">Spread</div>
        <div className="text-white">{spread ?? "-"}</div>
      </div>

      {/* 기존 주문 UI 유지 */}
    </div>
  );
}
