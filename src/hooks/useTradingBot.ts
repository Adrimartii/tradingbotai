import { useState, useEffect, useCallback, useRef } from 'react';
import { BotState, Trade, NewsItem } from '../types/trading';
import { RSI, EMA } from 'technicalindicators';
import * as binance from '../services/binance';
import * as news from '../services/news';
import * as ai from '../services/openai';

const STOP_LOSS_PERCENTAGE = 5;
const TAKE_PROFIT_PERCENTAGE = 10;
const UPDATE_INTERVAL = 60000; // 1 minute

async function calculateIndicators(historicalData: any[]) {
  const closes = historicalData.map(d => d.close);

  const rsi = RSI.calculate({
    values: closes,
    period: 14
  });

  const ema20 = EMA.calculate({
    values: closes,
    period: 20
  });

  const ema50 = EMA.calculate({
    values: closes,
    period: 50
  });

  return {
    rsi: rsi[rsi.length - 1],
    ema20: ema20[ema20.length - 1],
    ema50: ema50[ema50.length - 1]
  };
}

export function useTradingBot() {
  const [botState, setBotState] = useState<BotState>();
  const lastTradeRef = useRef<Date | null>(null);
  
  // Initialize bot state
  useEffect(() => {
    async function initializeBot() {
      const [balance, price, newsData] = await Promise.all([
        binance.getAccountBalance(),
        binance.getCurrentPrice(),
        news.getLatestNews()
      ]);

      const historicalData = await binance.getHistoricalData();
      const indicators = await calculateIndicators(historicalData);

      setBotState({
        isRunning: false,
        balance,
        initialBalance: balance,
        currentPrice: price,
        indicators: {
          ...indicators,
          lastUpdated: Date.now()
        },
        recentNews: newsData,
        trades: []
      });
    }

    initializeBot();
  }, []);

  const executeTrade = useCallback(async (type: 'BUY' | 'SELL', price: number) => {
    try {
      const result = await (type === 'BUY' ? 
        binance.executeBuyOrder() : 
        binance.executeSellOrder()
      );

      const trade: Trade = {
        id: Date.now().toString(),
        type,
        price,
        amount: result.data.executedQty * price,
        timestamp: Date.now(),
      };

      if (type === 'SELL' && botState?.trades.length > 0) {
        const lastBuy = [...botState.trades].reverse().find(t => t.type === 'BUY');
        if (lastBuy) {
          trade.profit = (price - lastBuy.price) * trade.amount / lastBuy.price;
        }
      }

      lastTradeRef.current = new Date();
      setBotState(async prev => ({
        ...prev!,
        balance: await binance.getAccountBalance(),
        lastTrade: trade,
        trades: [trade, ...prev!.trades].slice(0, 50)
      }));
    } catch (error) {
      console.error('Trade execution failed:', error);
    }
  }, []);

  useEffect(() => {
    if (!botState?.isRunning) return;

    const interval = setInterval(async () => {
      try {
        const [currentPrice, newsData, historicalData] = await Promise.all([
          binance.getCurrentPrice(),
          news.getLatestNews(),
          binance.getHistoricalData()
        ]);

        const indicators = await calculateIndicators(historicalData);
        
        // Get AI analysis
        const aiAnalysis = await ai.analyzeMarketConditions(
          newsData,
          indicators,
          currentPrice
        );

        // Prevent trading more often than every 5 minutes
        const canTrade = !lastTradeRef.current || 
          (new Date().getTime() - lastTradeRef.current.getTime()) > 300000;

        if (canTrade) {
          // Combined trading logic with technical indicators and AI
          if (
            (indicators.rsi < 30 && indicators.ema20 > indicators.ema50 && 
             aiAnalysis.sentiment === 'bullish' && aiAnalysis.confidence > 0.7)
          ) {
            await executeTrade('BUY', currentPrice);
          } else if (
            (indicators.rsi > 70 && indicators.ema20 < indicators.ema50 && 
             aiAnalysis.sentiment === 'bearish' && aiAnalysis.confidence > 0.7)
          ) {
            await executeTrade('SELL', currentPrice);
          }
        }

        setBotState(prev => ({
          ...prev!,
          currentPrice,
          indicators: {
            ...indicators,
            lastUpdated: Date.now()
          },
          recentNews: newsData
        }));
      } catch (error) {
        console.error('Bot update failed:', error);
      }
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [botState?.isRunning, executeTrade]);

  const toggleBot = useCallback(() => {
    setBotState(prev => ({
      ...prev!,
      isRunning: !prev!.isRunning,
    }));
  }, []);

  return { botState, toggleBot };
}