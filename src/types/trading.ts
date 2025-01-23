export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  price: number;
  amount: number;
  timestamp: number;
  profit?: number;
}

export interface TechnicalIndicators {
  rsi: number;
  ema20: number;
  ema50: number;
  macd: {
    MACD: number;
    signal: number;
    histogram: number;
  };
  bb: {
    upper: number;
    middle: number;
    lower: number;
  };
  volatility: number;
  support: number;
  resistance: number;
  volumeProfile: {
    zones: number[];
    poc: number;
  };
  liquidityLevels: {
    price: number;
    volume: number;
    type: 'support' | 'resistance';
  }[];
  timeframe: string;
  lastUpdated: number;
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source?: string;
}

export interface BotState {
  isRunning: boolean;
  balance: number;
  initialBalance: number;
  currentPrice: number;
  lastTrade?: Trade;
  indicators: TechnicalIndicators;
  recentNews: NewsItem[];
  trades: Trade[];
}
