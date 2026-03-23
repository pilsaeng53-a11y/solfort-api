// src/hooks/useFuturesSymbols.js

import { useEffect, useState } from "react";
import { fetchSymbols } from "../services/symbolsService";

export function useFuturesSymbols(category = "") {
  const [symbols, setSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function run() {
      setLoading(true);
      setError("");

      try {
        const rows = await fetchSymbols(category);
        if (!isMounted) return;
        setSymbols(rows);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to fetch symbols");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    run();

    return () => {
      isMounted = false;
    };
  }, [category]);

  return {
    symbols,
    loading,
    error,
  };
}
