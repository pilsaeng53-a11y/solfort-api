// src/components/trading/PositionsTabs.jsx

import React, { useMemo, useState } from "react";
import { useTradingSimulator } from "../../context/TradingSimulatorContext";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";

function formatNum(value, digits = 2) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const TABS = ["positions", "pending", "orders", "trades", "pnl"];

export default function PositionsTabs({ selectedSymbol }) {
  const [activeTab, setActiveTab] = useState("positions");

  const {
    openPositions,
    pendingOrders,
    orderHistory,
    tradeHistory,
    cancelPendingOrder,
    closePosition,
    calculateUnrealizedPnL,
  } = useTradingSimulator();

  const { quote } = useFuturesQuote(selectedSymbol);

  const filteredPositions = useMemo(
    () => openPositions.filter((p) => p.symbol === selectedSymbol || p.symbol === selectedSymbol?.replace("-T", "")),
    [openPositions, selectedSymbol]
  );

  const pnlSummary = useMemo(() => {
    const unrealized = filteredPositions.reduce((acc, p) => {
      return acc + calculateUnrealizedPnL(p, quote);
    }, 0);

    const realized = tradeHistory
      .filter((t) => t.type === "close")
      .reduce((acc, t) => acc + Number(t.realizedPnL || 0), 0);

    return {
      unrealized,
      realized,
      total: unrealized + realized,
    };
  }, [filteredPositions, quote, tradeHistory, calculateUnrealizedPnL]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1020] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/10 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
              activeTab === tab
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-400/40"
                : "bg-white/5 text-white/60 border border-white/10"
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "positions" && (
          <div className="space-y-3">
            {filteredPositions.length === 0 && (
              <div className="text-white/40 text-sm">No open positions</div>
            )}

            {filteredPositions.map((position) => {
              const unrealized = calculateUnrealizedPnL(position, quote);

              return (
                <div
                  key={position.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">
                      {position.symbol} · {position.side.toUpperCase()}
                    </div>
                    <div className={unrealized >= 0 ? "text-emerald-400" : "text-red-400"}>
                      {formatNum(unrealized, 2)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                    <div className="text-white/60">
                      Entry: <span className="text-white">{formatNum(position.entryPrice, 4)}</span>
                    </div>
                    <div className="text-white/60">
                      Qty: <span className="text-white">{formatNum(position.qty, 2)}</span>
                    </div>
                    <div className="text-white/60">
                      SL: <span className="text-white">{position.stopLoss ?? "-"}</span>
                    </div>
                    <div className="text-white/60">
                      TP: <span className="text-white">{position.takeProfit ?? "-"}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => closePosition(position.id, position.side === "buy" ? quote?.bid : quote?.ask)}
                      className="rounded-lg bg-red-500/90 hover:bg-red-500 text-white px-3 py-2 text-sm font-semibold"
                    >
                      Close Position
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "pending" && (
          <div className="space-y-3">
            {pendingOrders.length === 0 && (
              <div className="text-white/40 text-sm">No pending orders</div>
            )}

            {pendingOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-white font-semibold">
                    {order.symbol} · {order.side?.toUpperCase()} · {order.type?.toUpperCase()}
                  </div>
                  <div className="text-white/50 text-sm mt-1">
                    Qty {order.qty} @ {order.requestedPrice}
                  </div>
                </div>

                <button
                  onClick={() => cancelPendingOrder(order.id)}
                  className="rounded-lg bg-white/10 hover:bg-white/20 text-white px-3 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-2">
            {orderHistory.length === 0 && (
              <div className="text-white/40 text-sm">No order history</div>
            )}

            {orderHistory.map((order) => (
              <div
                key={order.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">
                    {order.symbol} · {order.side?.toUpperCase()} · {order.type?.toUpperCase()}
                  </div>
                  <div className="text-white/50">{order.status}</div>
                </div>
                <div className="mt-2 text-white/60">
                  Qty {order.qty} / Price {order.filledPrice || order.requestedPrice}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "trades" && (
          <div className="space-y-2">
            {tradeHistory.length === 0 && (
              <div className="text-white/40 text-sm">No trades</div>
            )}

            {tradeHistory.map((trade) => (
              <div
                key={trade.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="text-white font-semibold">
                    {trade.symbol} · {trade.type.toUpperCase()}
                  </div>
                  <div className={Number(trade.realizedPnL || 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {formatNum(trade.realizedPnL || 0, 2)}
                  </div>
                </div>
                <div className="mt-2 text-white/60">
                  Qty {trade.qty} / Price {trade.price}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "pnl" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/50 text-sm">Unrealized PnL</div>
              <div className={pnlSummary.unrealized >= 0 ? "text-emerald-400 text-2xl font-bold mt-2" : "text-red-400 text-2xl font-bold mt-2"}>
                {formatNum(pnlSummary.unrealized, 2)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/50 text-sm">Realized PnL</div>
              <div className={pnlSummary.realized >= 0 ? "text-emerald-400 text-2xl font-bold mt-2" : "text-red-400 text-2xl font-bold mt-2"}>
                {formatNum(pnlSummary.realized, 2)}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/50 text-sm">Total PnL</div>
              <div className={pnlSummary.total >= 0 ? "text-emerald-400 text-2xl font-bold mt-2" : "text-red-400 text-2xl font-bold mt-2"}>
                {formatNum(pnlSummary.total, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
