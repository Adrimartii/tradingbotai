import { useState, useEffect, useCallback, useRef } from 'react';
import { BotState, Trade, NewsItem } from '../types/trading';
import { RSI, EMA } from 'technicalindicators';
import * as binance from '../services/binance';
import * as news from '../services/news';
import { analyzeMarketConditions, incrementTradeCount } from '../services/openai';

// Timeframes constants
const TIMEFRAMES = {
  SCALPING: '1m',
  SHORT_TERM: '5m',
  MEDIUM_TERM: '1h',
  TREND: '4h'
};

const STOP_LOSS_PERCENTAGE = 5;
const TAKE_PROFIT_PERCENTAGE = 8;
const UPDATE_INTERVAL = 30000; // 30 secondes
const POSITION_SIZE_PERCENTAGE = 0.05; // 5% du capital par trade
const MAX_OPEN_POSITIONS = 3;

async function calculateIndicators(historicalData: any[], timeframe: string) {
  const closes = historicalData.map(d => d.close);
  const highs = historicalData.map(d => d.high);
  const lows = historicalData.map(d => d.low);
  const volumes = historicalData.map(d => d.volume);

  // Ajustement des périodes selon le timeframe
  const periods = getPeriodsByTimeframe(timeframe);

  const rsi = RSI.calculate({
    values: closes,
    period: periods.rsi
  });

  const macd = MACD.calculate({
    values: closes,
    fastPeriod: periods.macdFast,
    slowPeriod: periods.macdSlow,
    signalPeriod: 9
  });

  const bb = BollingerBands.calculate({
    values: closes,
    period: periods.bb,
    stdDev: 2
  });

  const ema20 = EMA.calculate({
    values: closes,
    period: periods.emaShort
  });

  const ema50 = EMA.calculate({
    values: closes,
    period: periods.emaLong
  });

  // Calcul du Volume Profile
  const volumeProfile = calculateVolumeProfile(closes, volumes);

  // Calcul des niveaux de liquidité
  const liquidityLevels = findLiquidityLevels(highs, lows, volumes);

  return {
    rsi: rsi[rsi.length - 1],
    ema20: ema20[ema20.length - 1],
    ema50: ema50[ema50.length - 1],
    macd: macd[macd.length - 1],
    bb: bb[bb.length - 1],
    volatility: calculateVolatility(closes),
    support: calculateSupport(lows.slice(-30)),
    resistance: calculateResistance(highs.slice(-30)),
    volumeProfile,
    liquidityLevels,
    timeframe
  };
}

function getPeriodsByTimeframe(timeframe: string) {
  switch (timeframe) {
    case TIMEFRAMES.SCALPING:
      return {
        rsi: 7,
        macdFast: 6,
        macdSlow: 13,
        bb: 10,
        emaShort: 10,
        emaLong: 25
      };
    case TIMEFRAMES.SHORT_TERM:
      return {
        rsi: 14,
        macdFast: 12,
        macdSlow: 26,
        bb: 20,
        emaShort: 20,
        emaLong: 50
      };
    case TIMEFRAMES.MEDIUM_TERM:
      return {
        rsi: 21,
        macdFast: 24,
        macdSlow: 52,
        bb: 30,
        emaShort: 50,
        emaLong: 100
      };
    default:
      return {
        rsi: 14,
        macdFast: 12,
        macdSlow: 26,
        bb: 20,
        emaShort: 20,
        emaLong: 50
      };
  }
}

function calculateVolumeProfile(prices: number[], volumes: number[]) {
  const priceRange = {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
  
  const zones = 10; // Diviser en 10 zones de prix
  const zoneSize = (priceRange.max - priceRange.min) / zones;
  
  const profile = new Array(zones).fill(0);
  
  prices.forEach((price, i) => {
    const zoneIndex = Math.floor((price - priceRange.min) / zoneSize);
    profile[zoneIndex] += volumes[i];
  });
  
  return {
    zones: profile,
    poc: profile.indexOf(Math.max(...profile)) // Point of Control
  };
}

function findLiquidityLevels(highs: number[], lows: number[], volumes: number[]) {
  const levels = [];
  const threshold = Math.max(...volumes) * 0.7; // 70% du volume max
  
  for (let i = 0; i < highs.length; i++) {
    if (volumes[i] > threshold) {
      levels.push({
        price: highs[i],
        volume: volumes[i],
        type: 'resistance'
      });
      levels.push({
        price: lows[i],
        volume: volumes[i],
        type: 'support'
      });
    }
  }
  
  return levels.sort((a, b) => b.volume - a.volume).slice(0, 5);
}

function calculateVolatility(prices: number[]): number {
  const returns = prices.slice(1).map((price, i) => 
    (price - prices[i]) / prices[i]
  );
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
}

function calculateSupport(lows: number[]): number {
  return Math.min(...lows);
}

function calculateResistance(highs: number[]): number {
  return Math.max(...highs);
}

function getPositionSize(balance: number, currentPrice: number): number {
  return (balance * POSITION_SIZE_PERCENTAGE) / currentPrice;
}

function shouldTakeProfit(entryPrice: number, currentPrice: number, type: 'BUY' | 'SELL'): boolean {
  const profitPercentage = type === 'BUY' ?
    ((currentPrice - entryPrice) / entryPrice) * 100 :
    ((entryPrice - currentPrice) / entryPrice) * 100;
  return profitPercentage >= TAKE_PROFIT_PERCENTAGE;
}

function shouldStopLoss(entryPrice: number, currentPrice: number, type: 'BUY' | 'SELL'): boolean {
  const lossPercentage = type === 'BUY' ?
    ((entryPrice - currentPrice) / entryPrice) * 100 :
    ((currentPrice - entryPrice) / entryPrice) * 100;
  return lossPercentage >= STOP_LOSS_PERCENTAGE;
}

export function useTradingBot() {
  const [botState, setBotState] = useState<BotState>();
  const lastTradeRef = useRef<Date | null>(null);
  const openPositionsRef = useRef<Trade[]>([]);
  
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
      // Vérifier le nombre de positions ouvertes
      if (openPositionsRef.current.length >= MAX_OPEN_POSITIONS) {
        console.log('Maximum open positions reached');
        return;
      }

      // Calculer la taille de la position
      const positionSize = getPositionSize(botState!.balance, price);

      // Incrémenter le compteur de trades
      incrementTradeCount(false);

      const result = await (type === 'BUY' ? 
        binance.executeBuyOrder(positionSize) : 
        binance.executeSellOrder(positionSize)
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

      // Gérer les positions ouvertes
      if (type === 'BUY') {
        openPositionsRef.current.push(trade);
      } else {
        openPositionsRef.current = openPositionsRef.current.filter(
          t => t.id !== trade.id
        );
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

    let timeframeData = {
      scalping: null,
      shortTerm: null,
      mediumTerm: null,
      trend: null
    };

    const interval = setInterval(async () => {
      try {
        const [currentPrice, newsData, ...historicalDataArray] = await Promise.all([
          binance.getCurrentPrice(),
          news.getLatestNews(),
          binance.getHistoricalData(TIMEFRAMES.SCALPING),
          binance.getHistoricalData(TIMEFRAMES.SHORT_TERM),
          binance.getHistoricalData(TIMEFRAMES.MEDIUM_TERM),
          binance.getHistoricalData(TIMEFRAMES.TREND)
        ]);

        // Calculer les indicateurs pour chaque timeframe
        [timeframeData.scalping, timeframeData.shortTerm, 
         timeframeData.mediumTerm, timeframeData.trend] = await Promise.all(
          historicalDataArray.map((data, i) => 
            calculateIndicators(data, Object.values(TIMEFRAMES)[i])
          )
        );

        // Analyse multi-timeframes
        const mtfAnalysis = analyzeMultiTimeframes(timeframeData);
        
        // Get AI analysis
        const aiAnalysis = await analyzeMarketConditions(
          newsData,
          timeframeData,
          currentPrice
        );

        // Prevent trading more often than every 5 minutes
        const canTrade = !lastTradeRef.current || 
          (new Date().getTime() - lastTradeRef.current.getTime()) > 300000;

        // Gérer les positions ouvertes (stop loss et take profit)
        openPositionsRef.current.forEach(async position => {
          if (position.type === 'BUY') {
            if (shouldTakeProfit(position.price, currentPrice, 'BUY')) {
              await executeTrade('SELL', currentPrice);
            } else if (shouldStopLoss(position.price, currentPrice, 'BUY')) {
              await executeTrade('SELL', currentPrice);
            }
          }
        });

        if (canTrade) {
          // Combined trading logic with technical indicators and AI
          if (
            (mtfAnalysis.trend === 'bullish' &&
             mtfAnalysis.strength > 0.7 &&
             isNearLiquidityLevel(currentPrice, timeframeData.shortTerm.liquidityLevels, 'support') &&
             aiAnalysis.sentiment === 'bullish' && 
             aiAnalysis.confidence > 0.7 &&
             timeframeData.shortTerm.volatility < 0.02)
          ) {
            incrementTradeCount(true);
            await executeTrade('BUY', currentPrice);
          } else if (
            (mtfAnalysis.trend === 'bearish' &&
             mtfAnalysis.strength > 0.7 &&
             isNearLiquidityLevel(currentPrice, timeframeData.shortTerm.liquidityLevels, 'resistance') &&
             aiAnalysis.sentiment === 'bearish' && 
             aiAnalysis.confidence > 0.7 &&
             timeframeData.shortTerm.volatility < 0.02)
          ) {
            incrementTradeCount(true);
            await executeTrade('SELL', currentPrice);
          }
        }

        setBotState(prev => ({
          ...prev!,
          currentPrice,
          indicators: timeframeData.shortTerm,
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
