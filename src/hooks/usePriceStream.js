// src/hooks/usePriceStream.js

import { useEffect, useMemo, useRef, useState } from "react";
import { getWsBaseUrl } from "../services/apiClient";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

export function usePriceStream(symbols = []) {
  const [connectionState, setConnectionState] = useState("idle");
  const [quotesMap, setQuotesMap] = useState({});

  const wsRef = useRef(null);

  const normalizedSymbols = useMemo(() => {
    return symbols
      .map((s) => normalizeSymbol(s))
      .filter(Boolean);
  }, [symbols]);

  useEffect(() => {
    if (!normalizedSymbols.length) return;

    const wsBase = getWsBaseUrl();
    const query = normalizedSymbols.join(",");
    const wsUrl = `${wsBase}?symbols=${encodeURIComponent(query)}`;

    setConnectionState("connecting");

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState("connected");
    };

    ws.onclose = () => {
      setConnectionState("closed");
    };

    ws.onerror = () => {
      setConnectionState("error");
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);

        if (parsed?.type === "quote" && parsed?.symbol && parsed?.data) {
          setQuotesMap((prev) => ({
            ...prev,
            [parsed.symbol]: parsed.data,
          }));
        }
      } catch {
        // ignore malformed messages
      }
    };

    return () => {
      try {
        ws.close();
      } catch {
        // ignore
      }
    };
  }, [normalizedSymbols]);

  return {
    connectionState,
    quotesMap,
  };
}
