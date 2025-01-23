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