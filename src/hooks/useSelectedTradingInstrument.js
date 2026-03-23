// src/hooks/useSelectedTradingInstrument.js

import { useMemo } from "react";
import { normalizeSymbol, toTradingViewSymbol } from "../utils/tradingSymbolMapper";

export function useSelectedTradingInstrument(selectedSymbol) {
  return useMemo(() => {
    const normalizedSymbol = normalizeSymbol(selectedSymbol);
    const tradingViewSymbol = toTradingViewSymbol(selectedSymbol);

    return {
      rawSymbol: selectedSymbol,
      normalizedSymbol,
      tradingViewSymbol,
    };
  }, [selectedSymbol]);
}
