// Providers
export { getAnthropicClient, generateWithClaude } from './providers/anthropic.provider';
export { getOpenAIClient, generateWithOpenAI } from './providers/openai.provider';
// Vercel AI Gateway — OFF by default; pass provider: 'vercel' and set AI_GATEWAY_API_KEY to use it.
export { getVercelGatewayClient, generateWithVercelGateway } from './providers/vercel-gateway.provider';

// Services
export { scoreDeal, type AIProvider } from './services/deal-scoring.service';
export { getTrafficLight, formatVerdict, getVerdictEmoji, type TrafficLightColor } from './services/verdict-generator.service';
export { predictSellThrough, type SellThroughInput } from './services/sell-through-predictor.service';
export { summarizeBulkScan, type BulkScanSummaryInput } from './services/bulk-scan-summary.service';
export { inferRiskFlags, type RiskFlagsInput, type RiskFlags, type RiskFlagResult } from './services/risk-flags.service';

// Prompts
export { DEAL_SCORE_SYSTEM_PROMPT, buildDealScoreUserMessage } from './prompts/deal-score.prompt';
export { SELL_THROUGH_SYSTEM_PROMPT, buildSellThroughMessage } from './prompts/verdict.prompt';
export { BULK_SCAN_SUMMARY_SYSTEM_PROMPT, buildBulkScanSummaryMessage } from './prompts/bulk-scan-summary.prompt';
export { RISK_FLAGS_SYSTEM_PROMPT, buildRiskFlagsMessage } from './prompts/risk-flags.prompt';
