import OpenAI from 'openai';
import NodeCache from 'node-cache';
import { NewsItem } from '../types/trading';

const aiTradesCache = new NodeCache();
const DAILY_TRADES_KEY = 'daily_trades_count';
const AI_TRADES_KEY = 'ai_trades_count';
const MAX_AI_TRADE_PERCENTAGE = 0.20; // 20% maximum des trades

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
});

function resetDailyCounters() {
  const now = new Date();
  const lastReset = aiTradesCache.get<string>('last_reset');
  
  if (!lastReset || new Date(lastReset).getDate() !== now.getDate()) {
    aiTradesCache.set(DAILY_TRADES_KEY, 0);
    aiTradesCache.set(AI_TRADES_KEY, 0);
    aiTradesCache.set('last_reset', now.toISOString());
  }
}

export function incrementTradeCount(isAITrade: boolean = false) {
  resetDailyCounters();
  
  const totalTrades = (aiTradesCache.get<number>(DAILY_TRADES_KEY) || 0) + 1;
  aiTradesCache.set(DAILY_TRADES_KEY, totalTrades);
  
  if (isAITrade) {
    const aiTrades = (aiTradesCache.get<number>(AI_TRADES_KEY) || 0) + 1;
    aiTradesCache.set(AI_TRADES_KEY, aiTrades);
  }
}

function canMakeAITrade(): boolean {
  resetDailyCounters();
  
  const totalTrades = aiTradesCache.get<number>(DAILY_TRADES_KEY) || 0;
  const aiTrades = aiTradesCache.get<number>(AI_TRADES_KEY) || 0;
  
  // Si pas encore de trades aujourd'hui, autoriser le premier trade
  if (totalTrades === 0) return true;
  
  // Calculer le pourcentage actuel de trades AI
  const currentAIPercentage = aiTrades / totalTrades;
  
  // Autoriser le trade si en dessous du seuil de 20%
  return currentAIPercentage < MAX_AI_TRADE_PERCENTAGE;
}

export async function analyzeMarketConditions(
  news: NewsItem[],
  technicalIndicators: {
    rsi: number;
    ema20: number;
    ema50: number;
  },
  currentPrice: number
): Promise<{
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  // Vérifier si on peut faire un trade basé sur l'IA
  if (!canMakeAITrade()) {
    return {
      sentiment: 'neutral',
      confidence: 0,
      reasoning: 'Limite quotidienne de trades IA atteinte (20%)'
    };
  }

  const prompt = `Analyze the current Bitcoin market conditions and provide a trading recommendation. Consider:

Technical Indicators:
- RSI: ${technicalIndicators.rsi}
- EMA20: ${technicalIndicators.ema20}
- EMA50: ${technicalIndicators.ema50}
- Current Price: $${currentPrice}

Recent News Headlines:
${news.slice(0, 3).map(n => `- ${n.title} (Sentiment: ${n.sentiment})`).join('\n')}

Analyze the news sentiment and market conditions. Your confidence must be above 0.7 to trigger a trade.
Weight the technical analysis at 70% and news sentiment at 30% in your decision.

Provide your analysis in JSON format with the following structure:
{
  "sentiment": "bullish/bearish/neutral",
  "confidence": 0-1,
  "reasoning": "brief explanation"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [{
      role: "system",
      content: "You are a cryptocurrency trading expert. Analyze market conditions with a focus on technical analysis (70%) and news sentiment (30%). Be conservative in your analysis and maintain high confidence thresholds."
    }, {
      role: "user",
      content: prompt
    }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}
