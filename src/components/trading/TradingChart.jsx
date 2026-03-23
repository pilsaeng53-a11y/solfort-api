import React, { useEffect, useMemo, useRef } from "react";
import { useSelectedTradingInstrument } from "../../hooks/useSelectedTradingInstrument";

export default function TradingChart({ selectedSymbol }) {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);

  const { tradingViewSymbol } = useSelectedTradingInstrument(selectedSymbol);

  useEffect(() => {
    if (!containerRef.current) return;

    if (widgetRef.current) {
      widgetRef.current.remove();
      widgetRef.current = null;
    }

    widgetRef.current = new window.TradingView.widget({
      autosize: true,
      symbol: tradingViewSymbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      container: containerRef.current,
    });

    return () => {
      if (widgetRef.current) {
        widgetRef.current.remove();
        widgetRef.current = null;
      }
    };
  }, [tradingViewSymbol]);

  return <div ref={containerRef} className="w-full h-full min-h-[500px]" />;
}
