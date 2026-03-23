// src/hooks/useOrderCalculator.js

import { useMemo } from "react";

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function useOrderCalculator({
  side = "buy",
  entryPrice,
  accountBalance = 10000,
  lotSize = 1,
  leverage = 10,
  stopLoss,
  takeProfit,
  contractMultiplier = 1,
}) {
  return useMemo(() => {
    const price = toNum(entryPrice);
    const lot = toNum(lotSize);
    const lev = Math.max(toNum(leverage, 1), 1);
    const balance = Math.max(toNum(accountBalance, 0), 0);
    const sl = toNum(stopLoss, 0);
    const tp = toNum(takeProfit, 0);

    if (!price || !lot) {
      return {
        notionalValue: 0,
        requiredMargin: 0,
        estimatedLiquidationPrice: null,
        stopLossRiskAmount: 0,
        takeProfitAmount: 0,
        riskPercentOfBalance: 0,
      };
    }

    const notionalValue = price * lot * contractMultiplier;
    const requiredMargin = notionalValue / lev;

    let estimatedLiquidationPrice = null;

    // 아주 단순화된 프리뷰 계산
    if (side === "buy") {
      estimatedLiquidationPrice = price * (1 - 1 / lev);
    } else {
      estimatedLiquidationPrice = price * (1 + 1 / lev);
    }

    let stopLossRiskAmount = 0;
    if (sl > 0) {
      stopLossRiskAmount =
        side === "buy"
          ? Math.max((price - sl) * lot * contractMultiplier, 0)
          : Math.max((sl - price) * lot * contractMultiplier, 0);
    }

    let takeProfitAmount = 0;
    if (tp > 0) {
      takeProfitAmount =
        side === "buy"
          ? Math.max((tp - price) * lot * contractMultiplier, 0)
          : Math.max((price - tp) * lot * contractMultiplier, 0);
    }

    const riskPercentOfBalance =
      balance > 0 ? (stopLossRiskAmount / balance) * 100 : 0;

    return {
      notionalValue,
      requiredMargin,
      estimatedLiquidationPrice,
      stopLossRiskAmount,
      takeProfitAmount,
      riskPercentOfBalance,
    };
  }, [
    side,
    entryPrice,
    accountBalance,
    lotSize,
    leverage,
    stopLoss,
    takeProfit,
    contractMultiplier,
  ]);
}
