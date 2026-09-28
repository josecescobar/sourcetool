import type { DealScoreInput, DealScoreOutput } from '@sourcetool/shared';
import { DEAL_SCORE_SYSTEM_PROMPT, buildDealScoreUserMessage } from '../prompts/deal-score.prompt';
import { callEnabledProvider, type AIProvider, type ProviderDeps } from '../provider-switch';

export type { AIProvider };

export async function scoreDeal(
  input: DealScoreInput,
  _provider?: AIProvider,
  deps?: ProviderDeps,
): Promise<DealScoreOutput> {
  const userMessage = buildDealScoreUserMessage(input);
  const responseText = await callEnabledProvider({
    service: 'scoreDeal',
    systemPrompt: DEAL_SCORE_SYSTEM_PROMPT,
    userMessage,
    temperature: 0.2,
    maxTokens: 512,
    env: deps?.env,
    fns: deps?.fns,
  });
  if (responseText == null) return heuristicDealScore(input);
  try {
    return parseDealScoreResponse(responseText);
  } catch {
    return heuristicDealScore(input);
  }
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
  if (validVerdicts.includes(verdict as (typeof validVerdicts)[number])) {
    return verdict as DealScoreOutput['verdict'];
  }
  // Derive from score if invalid
  if (score >= 80) return 'STRONG_BUY';
  if (score >= 60) return 'BUY';
  if (score >= 40) return 'HOLD';
  if (score >= 20) return 'PASS';
  return 'STRONG_PASS';
}

/** Local score used when the provider switch is off or the chosen provider fails. No network. */
function heuristicDealScore(input: DealScoreInput): DealScoreOutput {
  const roi = input.profitability?.roi ?? 0;
  const profit = input.profitability?.profit ?? 0;
  let score = 50;
  if (roi >= 50) score += 20;
  else if (roi >= 30) score += 10;
  else if (roi < 0) score -= 25;
  if (profit >= 5) score += 10;
  else if (profit < 0) score -= 15;
  if (input.alerts?.hasIpComplaints) score -= 10;
  if (input.alerts?.isHazmat) score -= 10;
  if (input.alerts?.isRestricted) score -= 10;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = validateVerdict('', score);

  return {
    score,
    verdict,
    reasoning: `Heuristic score from ROI ${roi}% and profit $${profit.toFixed(2)}. No paid provider was called.`,
    confidence: 0.3,
    factors: {
      profitability: { score: Math.max(0, Math.min(100, Math.round(50 + roi / 2))), notes: 'Local ROI/profit heuristic' },
      competition: { score: 50, notes: '' },
      demand: { score: 50, notes: '' },
      risk: { score: input.alerts?.hasIpComplaints || input.alerts?.isHazmat ? 20 : 70, notes: '' },
    },
  };
}
