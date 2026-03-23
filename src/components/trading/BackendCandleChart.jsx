import React, { useEffect, useMemo, useRef } from "react";
import { createChart, CrosshairMode } from "lightweight-charts";
import { useFuturesCandles } from "../../hooks/useFuturesCandles";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";
import { useLiveCandleSeries } from "../../hooks/useLiveCandleSeries";

function toChartData(candles = []) {
  return candles
    .map((item) => ({
      time: Math.floor(new Date(item.time).getTime() / 1000),
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.time) &&
        Number.isFinite(item.open) &&
        Number.isFinite(item.high) &&
        Number.isFinite(item.low) &&
        Number.isFinite(item.close)
    );
}

function getPricePrecision(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 5;
  if (symbol === "USDJPY") return 3;
  if (symbol === "XRP") return 4;
  return 2;
}

function getMinMove(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 0.00001;
  if (symbol === "USDJPY") return 0.001;
  if (symbol === "XRP") return 0.0001;
  return 0.01;
}

export default function BackendCandleChart({
  selectedSymbol,
  interval = "15m",
  height = 520,
}) {
  const normalizedSymbol = useMemo(
    () => normalizeSymbol(selectedSymbol),
    [selectedSymbol]
  );

  const { candles, loading, error } = useFuturesCandles(
    normalizedSymbol,
    interval,
    300
  );

  const { quote, connectionState } = useFuturesQuote(normalizedSymbol);
  const mergedCandles = useLiveCandleSeries(
    normalizedSymbol,
    candles,
    quote,
    interval
  );

  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const priceLineRef = useRef(null);

  const pricePrecision = getPricePrecision(normalizedSymbol);
  const chartData = useMemo(() => toChartData(mergedCandles), [mergedCandles]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: "#0b1020" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.1)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#10b981",
      downColor: "#475569",
      borderDownColor: "#475569",
      borderUpColor: "#10b981",
      wickDownColor: "#94a3b8",
      wickUpColor: "#10b981",
      priceFormat: {
        type: "price",
        precision: pricePrecision,
        minMove: getMinMove(normalizedSymbol),
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width, height: nextHeight } = entry.contentRect;
      chart.applyOptions({
        width,
        height: Math.max(nextHeight, 400),
      });
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      priceLineRef.current = null;
    };
  }, [height, pricePrecision, normalizedSymbol]);

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    candleSeriesRef.current.setData(chartData);

    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [chartData]);

  useEffect(() => {
    if (!candleSeriesRef.current || !quote?.last) return;

    if (priceLineRef.current) {
      try {
        candleSeriesRef.current.removePriceLine(priceLineRef.current);
      } catch {
        //
      }
    }

    priceLineRef.current = candleSeriesRef.current.createPriceLine({
      price: Number(quote.last),
      color: "#22c55e",
      lineWidth: 1,
      lineStyle: 2,
      axisLabelVisible: true,
      title: "Last",
    });
  }, [quote?.last]);

  return (
    <div className="w-full h-full rounded-2xl border border-white/10 bg-[#0b1020] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <div className="text-white font-semibold">
            {normalizedSymbol} Chart
          </div>
          <div className="text-xs text-white/50">
            Backend candles • {interval}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/50">Last Price</div>
          <div className="text-emerald-400 font-bold">
            {quote?.last ?? "-"}
          </div>
          <div className="text-[11px] text-white/40 mt-1">
            {connectionState}
          </div>
        </div>
      </div>

      {loading && (
        <div className="px-4 py-3 text-sm text-white/50">
          Loading candles...
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        style={{ height: `${height}px` }}
        className="w-full"
      />
    </div>
  );
}
