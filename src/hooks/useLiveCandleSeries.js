// src/hooks/useLiveCandleSeries.js

import { useMemo } from "react";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

function intervalToMs(interval) {
  const map = {
    "1m": 60 * 1000,
    "5m": 5 * 60 * 1000,
    "15m": 15 * 60 * 1000,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "4h": 4 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
  };

  return map[interval] || map["15m"];
}

function roundPrice(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Number(n.toFixed(digits));
}

function getDigits(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 5;
  if (symbol === "USDJPY") return 3;
  if (symbol === "XRP") return 4;
  return 2;
}

export function useLiveCandleSeries(selectedSymbol, candles = [], quote, interval = "15m") {
  return useMemo(() => {
    const normalizedSymbol = normalizeSymbol(selectedSymbol);
    const digits = getDigits(normalizedSymbol);
    const intervalMs = intervalToMs(interval);

    if (!Array.isArray(candles) || candles.length === 0) return [];

    const base = candles.map((c) => ({
      time: c.time,
      timestamp: c.timestamp,
      open: Number(c.open),
      high: Number(c.high),
      low: Number(c.low),
      close: Number(c.close),
      volume: Number(c.volume ?? 0),
    }));

    if (!quote?.last) return base;

    const now = Date.now();
    const bucketStart = Math.floor(now / intervalMs) * intervalMs;
    const last = base[base.length - 1];

    if (!last) return base;

    const livePrice = Number(quote.last);

    // 현재 진행봉 시간과 마지막 봉 시간이 같은 버킷이면 마지막 봉만 갱신
    if (last.timestamp === bucketStart) {
      const updated = {
        ...last,
        high: roundPrice(Math.max(last.high, livePrice), digits),
        low: roundPrice(Math.min(last.low, livePrice), digits),
        close: roundPrice(livePrice, digits),
      };

      return [...base.slice(0, -1), updated];
    }

    // 새 버킷이면 새 봉 생성
    const newCandle = {
      time: new Date(bucketStart).toISOString(),
      timestamp: bucketStart,
      open: roundPrice(last.close, digits),
      high: roundPrice(Math.max(last.close, livePrice), digits),
      low: roundPrice(Math.min(last.close, livePrice), digits),
      close: roundPrice(livePrice, digits),
      volume: 0,
    };

    return [...base, newCandle];
  }, [selectedSymbol, candles, quote, interval]);
}
