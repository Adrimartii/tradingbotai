import React from 'react';
import TradingDashboard from './components/TradingDashboard';
import { useTradingBot } from './hooks/useTradingBot';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

function App() {
  const { botState, toggleBot } = useTradingBot();

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <TradingDashboard botState={botState} onToggleBot={toggleBot} />
      </div>
      <Tooltip id="main-title" place="right" />
      <Tooltip id="bot-button" place="left" />
      <Tooltip id="balance" place="top" />
      <Tooltip id="profit-loss" place="bottom" />
      <Tooltip id="rsi" place="top" />
      <Tooltip id="rsi-indicator" place="right" />
    </>
  );
}

export default App;
