// Providers
export { getAnthropicClient, generateWithClaude } from './providers/anthropic.provider';
export { getOpenAIClient, generateWithOpenAI } from './providers/openai.provider';
// Vercel AI Gateway — OFF by default; pass provider: 'vercel' and set AI_GATEWAY_API_KEY to use it.
export { getVercelGatewayClient, generateWithVercelGateway } from './providers/vercel-gateway.provider';

// Services
export { scoreDeal, type AIProvider } from './services/deal-scoring.service';
export { getTrafficLight, formatVerdict, getVerdictEmoji, type TrafficLightColor } from './services/verdict-generator.service';
export { predictSellThrough, type SellThroughInput } from './services/sell-through-predictor.service';

// Prompts
export { DEAL_SCORE_SYSTEM_PROMPT, buildDealScoreUserMessage } from './prompts/deal-score.prompt';
export { SELL_THROUGH_SYSTEM_PROMPT, buildSellThroughMessage } from './prompts/verdict.prompt';
