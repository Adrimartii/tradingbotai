import OpenAI from 'openai';
import { NewsItem } from '../types/trading';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || ''
});

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
  const prompt = `Analyze the current Bitcoin market conditions and provide a trading recommendation. Consider:

Technical Indicators:
- RSI: ${technicalIndicators.rsi}
- EMA20: ${technicalIndicators.ema20}
- EMA50: ${technicalIndicators.ema50}
- Current Price: $${currentPrice}

Recent News Headlines:
${news.slice(0, 3).map(n => `- ${n.title} (Sentiment: ${n.sentiment})`).join('\n')}

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
      content: "You are a cryptocurrency trading expert. Analyze market conditions and provide concise, actionable insights."
    }, {
      role: "user",
      content: prompt
    }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}