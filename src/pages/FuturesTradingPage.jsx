import React, { useState } from "react";
import { TradingSimulatorProvider } from "../context/TradingSimulatorContext";
import InstrumentSidebar from "../components/trading/InstrumentSidebar";
import TradingChart from "../components/trading/TradingChart";
import OrderPanel from "../components/trading/OrderPanel";
import DepthOfMarket from "../components/trading/DepthOfMarket";
import PositionsTabs from "../components/trading/PositionsTabs";

export default function FuturesTradingPage() {
  const [selectedSymbol, setSelectedSymbol] = useState("EURUSD-T");

  return (
    <TradingSimulatorProvider>
      <div className="grid grid-cols-12 gap-4 h-full">
        <div className="col-span-2">
          <InstrumentSidebar
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
          />
        </div>

        <div className="col-span-7 flex flex-col gap-4">
          <TradingChart selectedSymbol={selectedSymbol} />
          <PositionsTabs selectedSymbol={selectedSymbol} />
        </div>

        <div className="col-span-3 flex flex-col gap-4">
          <OrderPanel selectedSymbol={selectedSymbol} />
          <DepthOfMarket selectedSymbol={selectedSymbol} />
        </div>
      </div>
    </TradingSimulatorProvider>
  );
}
