import type { DealScoreInput, DealScoreOutput } from '@sourcetool/shared';
import { generateWithClaude } from '../providers/anthropic.provider';
import { generateWithOpenAI } from '../providers/openai.provider';
import { DEAL_SCORE_SYSTEM_PROMPT, buildDealScoreUserMessage } from '../prompts/deal-score.prompt';

export type AIProvider = 'anthropic' | 'openai';

export async function scoreDeal(
  input: DealScoreInput,
  provider: AIProvider = 'anthropic'
): Promise<DealScoreOutput> {
  const userMessage = buildDealScoreUserMessage(input);

  let responseText: string;

  try {
    if (provider === 'anthropic') {
      responseText = await generateWithClaude(DEAL_SCORE_SYSTEM_PROMPT, userMessage, {
        temperature: 0.2,
        maxTokens: 512,
      });
    } else {
      responseText = await generateWithOpenAI(DEAL_SCORE_SYSTEM_PROMPT, userMessage, {
        temperature: 0.2,
        maxTokens: 512,
      });
    }
  } catch (error) {
    // If primary provider fails and we have a fallback, try it
    if (provider === 'anthropic' && process.env.OPENAI_API_KEY) {
      responseText = await generateWithOpenAI(DEAL_SCORE_SYSTEM_PROMPT, userMessage, {
        temperature: 0.2,
        maxTokens: 512,
      });
    } else if (provider === 'openai' && process.env.ANTHROPIC_API_KEY) {
      responseText = await generateWithClaude(DEAL_SCORE_SYSTEM_PROMPT, userMessage, {
        temperature: 0.2,
        maxTokens: 512,
      });
    } else {
      throw error;
    }
  }

  return parseDealScoreResponse(responseText);
}

function parseDealScoreResponse(text: string): DealScoreOutput {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response: no JSON found');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate and normalize
  const score = Math.max(0, Math.min(100, Math.round(parsed.score)));
  const verdict = validateVerdict(parsed.verdict, score);

  return {
    score,
    verdict,
    reasoning: parsed.reasoning || `${verdict} — Score: ${score}/100`,
    confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    factors: {
      profitability: {
        score: Math.max(0, Math.min(100, parsed.factors?.profitability?.score ?? 50)),
        notes: parsed.factors?.profitability?.notes ?? '',
      },
      competition: {
        score: Math.max(0, Math.min(100, parsed.factors?.competition?.score ?? 50)),
        notes: parsed.factors?.competition?.notes ?? '',
      },
      demand: {
        score: Math.max(0, Math.min(100, parsed.factors?.demand?.score ?? 50)),
        notes: parsed.factors?.demand?.notes ?? '',
      },
      risk: {
        score: Math.max(0, Math.min(100, parsed.factors?.risk?.score ?? 50)),
        notes: parsed.factors?.risk?.notes ?? '',
      },
    },
  };
}

function validateVerdict(verdict: string, score: number): DealScoreOutput['verdict'] {
  const validVerdicts = ['STRONG_BUY', 'BUY', 'HOLD', 'PASS', 'STRONG_PASS'] as const;
  if (validVerdicts.includes(verdict as any)) {
    return verdict as DealScoreOutput['verdict'];
  }
  // Derive from score if invalid
  if (score >= 80) return 'STRONG_BUY';
  if (score >= 60) return 'BUY';
  if (score >= 40) return 'HOLD';
  if (score >= 20) return 'PASS';
  return 'STRONG_PASS';
}
