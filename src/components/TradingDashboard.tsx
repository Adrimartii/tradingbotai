import React from 'react';
import { LineChart, Activity, Newspaper, History } from 'lucide-react';
import { BotState } from '../types/trading';

interface Props {
  botState: BotState;
  onToggleBot: () => void;
}

export default function TradingDashboard({ botState, onToggleBot }: Props) {
  const profitLoss = botState.balance - botState.initialBalance;
  const profitPercentage = (profitLoss / botState.initialBalance) * 100;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <LineChart className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900" data-tooltip-id="main-title" data-tooltip-content="Simulateur de trading automatique">
            Simulateur de Bot Trading
          </h1>
        </div>
        <button
          onClick={onToggleBot}
          data-tooltip-id="bot-button"
          data-tooltip-content={botState.isRunning ? 
            'Arrêter le bot de trading' : 
            'Démarrer le bot de trading pour commencer les transactions automatiques'}
          className={`px-6 py-2 rounded-lg font-medium ${
            botState.isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white' 
          }`}
        >
          {botState.isRunning ? 'Arrêter le Bot' : 'Démarrer le Bot'}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium" data-tooltip-id="balance" data-tooltip-content="Solde actuel du compte">
              Solde Actuel
            </h3>
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {botState.balance.toFixed(2)}€
          </p>
          <p className={`mt-1 text-sm ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
             data-tooltip-id="profit-loss"
             data-tooltip-content="Pourcentage de profit ou perte depuis le début">
            {profitLoss >= 0 ? '↑' : '↓'} {Math.abs(profitPercentage).toFixed(2)}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium" 
                data-tooltip-id="rsi"
                data-tooltip-content="Relative Strength Index - Indicateur de surachat/survente. <30: survente (achat), >70: surachat (vente)">
              RSI
            </h3>
            <div className={`h-3 w-3 rounded-full ${
              botState.indicators.rsi < 30 ? 'bg-green-500' :
              botState.indicators.rsi > 70 ? 'bg-red-500' :
              'bg-yellow-500'
            }`}
                 data-tooltip-id="rsi-indicator"
                 data-tooltip-content={botState.indicators.rsi < 30 ? 'Signal d\'achat' : 
                        botState.indicators.rsi > 70 ? 'Signal de vente' : 
                        'Pas de signal'} />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {botState.indicators.rsi.toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Mis à jour à {new Date(botState.indicators.lastUpdated).toLocaleTimeString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium" 
                title="Croisement des moyennes mobiles exponentielles - Signal d'achat quand EMA20 > EMA50">
              Croisement EMA
            </h3>
            <div className={`h-3 w-3 rounded-full ${
              botState.indicators.ema20 > botState.indicators.ema50 ? 'bg-green-500' : 'bg-red-500'
            }`} 
                 title={botState.indicators.ema20 > botState.indicators.ema50 ? 
                        'Tendance haussière' : 'Tendance baissière'} />
          </div>
          <div className="mt-2">
            <p className="text-sm font-medium">EMA20: {botState.indicators.ema20.toFixed(2)}</p>
            <p className="text-sm font-medium">EMA50: {botState.indicators.ema50.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-gray-500 text-sm font-medium" 
                title="Prix actuel de l'actif">Prix Actuel</h3>
            <History className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {botState.currentPrice.toFixed(2)}€
          </p>
          {botState.lastTrade && (
            <p className={`mt-1 text-sm ${
              botState.lastTrade.type === 'BUY' ? 'text-green-600' : 'text-red-600'
            }`}>
              Dernier {botState.lastTrade.type === 'BUY' ? 'achat' : 'vente'} 
              à {botState.lastTrade.price.toFixed(2)}€
            </p>
          )}
        </div>
      </div>

      {/* News Feed */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Newspaper className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">Dernières Actualités</h2>
        </div>
        <div className="space-y-4">
          {botState.recentNews.map((news) => (
            <div key={news.url} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-gray-900 hover:text-indigo-600"
              >
                {news.title}
                {news.source && (
                  <span className="ml-2 text-sm text-gray-500">
                    - {news.source}
                  </span>
                )}
              </a>
              <p className="mt-1 text-sm text-gray-500">{news.description}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(news.publishedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-gray-900">Transactions Récentes</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm font-medium text-gray-500">
                <th className="pb-3">Action</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">Montant</th>
                <th className="pb-3">Profit/Perte</th>
                <th className="pb-3">Heure</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {botState.trades.map((trade) => (
                <tr key={trade.id}>
                  <td className={`py-2 font-medium ${
                    trade.type === 'BUY' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.type === 'BUY' ? '🛒 ACHAT' : '💰 VENTE'}
                  </td>
                  <td className="py-2">{trade.price.toFixed(2)}€</td>
                  <td className="py-2">{trade.amount.toFixed(2)}€</td>
                  <td className={`py-2 ${
                    trade.profit && trade.profit > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {trade.profit ? `${trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}€` : '-'}
                  </td>
                  <td className="py-2 text-gray-500">
                    {new Date(trade.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}