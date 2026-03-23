// src/hooks/useFuturesQuote.js

import { useEffect, useMemo, useState } from "react";
import { fetchQuote } from "../services/quotesService";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";
import { usePriceStream } from "./usePriceStream";

export function useFuturesQuote(selectedSymbol) {
  const normalizedSymbol = useMemo(
    () => normalizeSymbol(selectedSymbol),
    [selectedSymbol]
  );

  const [initialQuote, setInitialQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { connectionState, quotesMap } = usePriceStream(
    normalizedSymbol ? [normalizedSymbol] : []
  );

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!normalizedSymbol) return;

      setLoading(true);
      setError("");

      try {
        const data = await fetchQuote(normalizedSymbol);

        if (!isMounted) return;
        setInitialQuote(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to fetch quote");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [normalizedSymbol]);

  const liveQuote = quotesMap[normalizedSymbol] || initialQuote;

  return {
    normalizedSymbol,
    quote: liveQuote,
    loading,
    error,
    connectionState,
  };
}
