import React, { useMemo, useState } from "react";
import { useFuturesQuote } from "../../hooks/useFuturesQuote";
import { normalizeSymbol } from "../../utils/tradingSymbolMapper";
import { useOrderCalculator } from "../../hooks/useOrderCalculator";

function formatPrice(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function getDigits(symbol) {
  if (["EURUSD", "GBPUSD", "AUDUSD"].includes(symbol)) return 5;
  if (symbol === "USDJPY") return 3;
  if (symbol === "XRP") return 4;
  return 2;
}

export default function OrderPanel({ selectedSymbol }) {
  const { quote, loading } = useFuturesQuote(selectedSymbol);
  const normalizedSymbol = normalizeSymbol(selectedSymbol);

  const digits = getDigits(normalizedSymbol);

  const [side, setSide] = useState("buy");
  const [lotSize, setLotSize] = useState(1);
  const [leverage, setLeverage] = useState(10);
  const [balance, setBalance] = useState(10000);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");

  const entryPrice = useMemo(() => {
    if (!quote) return 0;
    return side === "buy" ? quote.ask : quote.bid;
  }, [quote, side]);

  const {
    notionalValue,
    requiredMargin,
    estimatedLiquidationPrice,
    stopLossRiskAmount,
    takeProfitAmount,
    riskPercentOfBalance,
  } = useOrderCalculator({
    side,
    entryPrice,
    accountBalance: balance,
    lotSize,
    leverage,
    stopLoss,
    takeProfit,
    contractMultiplier: 1,
  });

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-xs text-white/50">Selected Market</div>
        <div className="text-white font-semibold">{normalizedSymbol}</div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setSide("buy")}
          className={`rounded-xl py-3 font-bold ${
            side === "buy"
              ? "bg-emerald-500 text-white"
              : "bg-white/5 text-white/70 border border-white/10"
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setSide("sell")}
          className={`rounded-xl py-3 font-bold ${
            side === "sell"
              ? "bg-slate-600 text-white"
              : "bg-white/5 text-white/70 border border-white/10"
          }`}
        >
          SELL
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-white/50 mb-1">Entry Price</div>
        <div className="text-2xl font-bold text-white">
          {loading ? "..." : formatPrice(entryPrice, digits)}
        </div>
        <div className="text-xs text-white/50 mt-2">
          Bid {formatPrice(quote?.bid, digits)} / Ask {formatPrice(quote?.ask, digits)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Lot Size</label>
          <input
            type="number"
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Leverage</label>
          <select
            value={leverage}
            onChange={(e) => setLeverage(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
          >
            {[1, 5, 10, 20, 30, 50, 100].map((lv) => (
              <option key={lv} value={lv}>
                {lv}x
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1">Account Balance</label>
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Stop Loss</label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="text-xs text-white/50 block mb-1">Take Profit</label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white"
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1020] p-3 space-y-2 text-sm">
        <div className="flex justify-between text-white/70">
          <span>Notional Value</span>
          <span>{formatPrice(notionalValue, 2)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Required Margin</span>
          <span>{formatPrice(requiredMargin, 2)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Spread</span>
          <span>{formatPrice(quote?.spread, digits)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Est. Liquidation</span>
          <span>{formatPrice(estimatedLiquidationPrice, digits)}</span>
        </div>
        <div className="flex justify-between text-red-400">
          <span>SL Risk</span>
          <span>{formatPrice(stopLossRiskAmount, 2)}</span>
        </div>
        <div className="flex justify-between text-emerald-400">
          <span>TP Reward</span>
          <span>{formatPrice(takeProfitAmount, 2)}</span>
        </div>
        <div className="flex justify-between text-white/70">
          <span>Risk % of Balance</span>
          <span>{formatPrice(riskPercentOfBalance, 2)}%</span>
        </div>
      </div>

      <button className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4">
        Place {side === "buy" ? "Buy" : "Sell"} Order
      </button>
    </div>
  );
}
