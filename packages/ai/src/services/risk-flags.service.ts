import { generateWithClaude } from '../providers/anthropic.provider';
import { generateWithOpenAI } from '../providers/openai.provider';
import { generateWithVercelGateway } from '../providers/vercel-gateway.provider';
import { RISK_FLAGS_SYSTEM_PROMPT, buildRiskFlagsMessage } from '../prompts/risk-flags.prompt';
import type { AIProvider } from './deal-scoring.service';

export interface RiskFlagsInput {
  title: string;
  brand?: string;
  category?: string;
}

export interface RiskFlagResult {
  flagged: boolean;
  reason?: string;
}

export interface RiskFlags {
  ipComplaints: RiskFlagResult;
  hazmat: RiskFlagResult;
  restricted: RiskFlagResult;
  meltable: RiskFlagResult;
  privateLabel: RiskFlagResult;
}

export async function inferRiskFlags(
  input: RiskFlagsInput,
  provider: AIProvider = 'anthropic'
): Promise<RiskFlags> {
  const userMessage = buildRiskFlagsMessage(input);

  let responseText: string;

  try {
    if (provider === 'anthropic') {
      responseText = await generateWithClaude(RISK_FLAGS_SYSTEM_PROMPT, userMessage, {
        temperature: 0.1,
        maxTokens: 400,
      });
    } else if (provider === 'vercel') {
      responseText = await generateWithVercelGateway(RISK_FLAGS_SYSTEM_PROMPT, userMessage, {
        temperature: 0.1,
        maxTokens: 400,
      });
    } else {
      responseText = await generateWithOpenAI(RISK_FLAGS_SYSTEM_PROMPT, userMessage, {
        temperature: 0.1,
        maxTokens: 400,
      });
    }
  } catch (error) {
    // If the Gateway call fails, try Anthropic before giving up to the heuristic.
    if (provider === 'vercel' && process.env.ANTHROPIC_API_KEY) {
      try {
        responseText = await generateWithClaude(RISK_FLAGS_SYSTEM_PROMPT, userMessage, {
          temperature: 0.1,
          maxTokens: 400,
        });
      } catch {
        return heuristicRiskFlags(input);
      }
    } else if (provider === 'anthropic' && process.env.OPENAI_API_KEY) {
      try {
        responseText = await generateWithOpenAI(RISK_FLAGS_SYSTEM_PROMPT, userMessage, {
          temperature: 0.1,
          maxTokens: 400,
        });
      } catch {
        return heuristicRiskFlags(input);
      }
    } else {
      return heuristicRiskFlags(input);
    }
  }

  try {
    return parseRiskFlagsResponse(responseText);
  } catch {
    return heuristicRiskFlags(input);
  }
}

function parseRiskFlagsResponse(text: string): RiskFlags {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response: no JSON found');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const normalize = (value: any): RiskFlagResult => ({
    flagged: value?.flagged === true,
    reason: typeof value?.reason === 'string' ? value.reason : undefined,
  });

  return {
    ipComplaints: normalize(parsed.ipComplaints),
    hazmat: normalize(parsed.hazmat),
    restricted: normalize(parsed.restricted),
    meltable: normalize(parsed.meltable),
    privateLabel: normalize(parsed.privateLabel),
  };
}

// Conservative last-resort fallback when both AI providers are unavailable.
// Only flags categories where a keyword hit is a reasonably reliable signal —
// ipComplaints/privateLabel need real brand judgment, so they default to
// unflagged here rather than guess.
function heuristicRiskFlags(input: RiskFlagsInput): RiskFlags {
  const text = `${input.title} ${input.category ?? ''}`.toLowerCase();

  const hasAny = (keywords: string[]) => keywords.some((kw) => text.includes(kw));

  const hazmatKeywords = ['battery', 'batteries', 'lithium', 'aerosol', 'flammable', 'propane', 'butane', 'compressed gas', 'pesticide', 'bleach'];
  const restrictedKeywords = ['knife', 'knives', 'supplement', 'vitamin', 'cbd', 'vape', 'e-cigarette', 'firearm', 'ammo', 'ammunition', 'prescription', 'alcohol'];
  const meltableKeywords = ['chocolate', 'candle', 'wax', 'crayon', 'lip balm', 'gummy', 'gummies'];

  return {
    ipComplaints: { flagged: false },
    hazmat: hasAny(hazmatKeywords) ? { flagged: true, reason: 'Title suggests a hazardous material.' } : { flagged: false },
    restricted: hasAny(restrictedKeywords) ? { flagged: true, reason: 'Title suggests a commonly restricted category.' } : { flagged: false },
    meltable: hasAny(meltableKeywords) ? { flagged: true, reason: 'Title suggests a heat-sensitive product.' } : { flagged: false },
    privateLabel: { flagged: false },
  };
}
