// src/hooks/useFuturesCandles.js

import { useEffect, useState } from "react";
import { fetchCandles } from "../services/candlesService";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

export function useFuturesCandles(selectedSymbol, interval = "15m", limit = 200) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      const normalizedSymbol = normalizeSymbol(selectedSymbol);
      if (!normalizedSymbol) return;

      setLoading(true);
      setError("");

      try {
        const candles = await fetchCandles(normalizedSymbol, interval, limit);
        if (!isMounted) return;
        setData(candles);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to fetch candles");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, interval, limit]);

  return {
    candles: data,
    loading,
    error,
  };
}
