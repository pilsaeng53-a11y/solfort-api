// src/context/TradingSimulatorContext.jsx

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { normalizeSymbol } from "../utils/tradingSymbolMapper";

const TradingSimulatorContext = createContext(null);

function uid(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calculateUnrealizedPnL(position, currentQuote) {
  if (!position || !currentQuote) return 0;

  const mark = position.side === "buy"
    ? toNum(currentQuote.bid)
    : toNum(currentQuote.ask);

  if (!mark || !position.entryPrice || !position.qty) return 0;

  if (position.side === "buy") {
    return (mark - position.entryPrice) * position.qty;
  }

  return (position.entryPrice - mark) * position.qty;
}

const initialState = {
  pendingOrders: [],
  openPositions: [],
  orderHistory: [],
  tradeHistory: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "PLACE_MARKET_ORDER": {
      const {
        symbol,
        side,
        qty,
        entryPrice,
        leverage,
        stopLoss,
        takeProfit,
      } = action.payload;

      const orderId = uid("ord");
      const positionId = uid("pos");
      const tradeId = uid("trd");
      const now = new Date().toISOString();

      const orderRecord = {
        id: orderId,
        symbol,
        type: "market",
        side,
        qty,
        leverage,
        requestedPrice: entryPrice,
        status: "filled",
        filledPrice: entryPrice,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        createdAt: now,
        filledAt: now,
      };

      const position = {
        id: positionId,
        symbol,
        side,
        qty,
        leverage,
        entryPrice,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        createdAt: now,
      };

      const tradeRecord = {
        id: tradeId,
        orderId,
        positionId,
        symbol,
        side,
        qty,
        price: entryPrice,
        realizedPnL: 0,
        type: "open",
        createdAt: now,
      };

      return {
        ...state,
        orderHistory: [orderRecord, ...state.orderHistory],
        openPositions: [position, ...state.openPositions],
        tradeHistory: [tradeRecord, ...state.tradeHistory],
      };
    }

    case "PLACE_PENDING_ORDER": {
      const now = new Date().toISOString();
      const record = {
        id: uid("ord"),
        status: "pending",
        createdAt: now,
        ...action.payload,
      };

      return {
        ...state,
        pendingOrders: [record, ...state.pendingOrders],
        orderHistory: [record, ...state.orderHistory],
      };
    }

    case "CANCEL_PENDING_ORDER": {
      const nextPending = state.pendingOrders.filter((o) => o.id !== action.payload.id);
      const nextHistory = state.orderHistory.map((o) =>
        o.id === action.payload.id ? { ...o, status: "cancelled", cancelledAt: new Date().toISOString() } : o
      );

      return {
        ...state,
        pendingOrders: nextPending,
        orderHistory: nextHistory,
      };
    }

    case "CLOSE_POSITION": {
      const { positionId, exitPrice } = action.payload;
      const position = state.openPositions.find((p) => p.id === positionId);
      if (!position) return state;

      const now = new Date().toISOString();

      const realizedPnL =
        position.side === "buy"
          ? (exitPrice - position.entryPrice) * position.qty
          : (position.entryPrice - exitPrice) * position.qty;

      const closeTrade = {
        id: uid("trd"),
        positionId: position.id,
        symbol: position.symbol,
        side: position.side === "buy" ? "sell" : "buy",
        qty: position.qty,
        price: exitPrice,
        realizedPnL,
        type: "close",
        createdAt: now,
      };

      return {
        ...state,
        openPositions: state.openPositions.filter((p) => p.id !== positionId),
        tradeHistory: [closeTrade, ...state.tradeHistory],
      };
    }

    case "UPDATE_POSITION_SLTP": {
      const { positionId, stopLoss, takeProfit } = action.payload;

      return {
        ...state,
        openPositions: state.openPositions.map((p) =>
          p.id === positionId
            ? {
                ...p,
                stopLoss: stopLoss ?? p.stopLoss,
                takeProfit: takeProfit ?? p.takeProfit,
              }
            : p
        ),
      };
    }

    default:
      return state;
  }
}

export function TradingSimulatorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(() => {
    const placeMarketOrder = (payload) => {
      dispatch({ type: "PLACE_MARKET_ORDER", payload });
    };

    const placePendingOrder = (payload) => {
      dispatch({ type: "PLACE_PENDING_ORDER", payload });
    };

    const cancelPendingOrder = (id) => {
      dispatch({ type: "CANCEL_PENDING_ORDER", payload: { id } });
    };

    const closePosition = (positionId, exitPrice) => {
      dispatch({ type: "CLOSE_POSITION", payload: { positionId, exitPrice } });
    };

    const updatePositionSLTP = (positionId, stopLoss, takeProfit) => {
      dispatch({
        type: "UPDATE_POSITION_SLTP",
        payload: { positionId, stopLoss, takeProfit },
      });
    };

    return {
      ...state,
      placeMarketOrder,
      placePendingOrder,
      cancelPendingOrder,
      closePosition,
      updatePositionSLTP,
      calculateUnrealizedPnL,
    };
  }, [state]);

  return (
    <TradingSimulatorContext.Provider value={value}>
      {children}
    </TradingSimulatorContext.Provider>
  );
}

export function useTradingSimulator() {
  const ctx = useContext(TradingSimulatorContext);
  if (!ctx) {
    throw new Error("useTradingSimulator must be used inside TradingSimulatorProvider");
  }
  return ctx;
}
