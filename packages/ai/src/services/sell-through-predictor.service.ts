import type { SellThroughPrediction } from '@sourcetool/shared';
import { generateWithClaude } from '../providers/anthropic.provider';
import { generateWithOpenAI } from '../providers/openai.provider';
import { SELL_THROUGH_SYSTEM_PROMPT, buildSellThroughMessage } from '../prompts/verdict.prompt';
import type { AIProvider } from './deal-scoring.service';

export interface SellThroughInput {
  title: string;
  category?: string;
  bsr?: number;
  sellPrice: number;
  offerCount?: number;
  fbaOfferCount?: number;
  isAmazonSelling?: boolean;
  avgBsr30d?: number;
}

export async function predictSellThrough(
  input: SellThroughInput,
  provider: AIProvider = 'anthropic'
): Promise<SellThroughPrediction> {
  const userMessage = buildSellThroughMessage(input);

  let responseText: string;

  try {
    if (provider === 'anthropic') {
      responseText = await generateWithClaude(SELL_THROUGH_SYSTEM_PROMPT, userMessage, {
        temperature: 0.3,
        maxTokens: 256,
      });
    } else {
      responseText = await generateWithOpenAI(SELL_THROUGH_SYSTEM_PROMPT, userMessage, {
        temperature: 0.3,
        maxTokens: 256,
      });
    }
  } catch (error) {
    // Fallback to heuristic if AI fails
    return heuristicSellThrough(input);
  }

  return parseSellThroughResponse(responseText, input);
}

function parseSellThroughResponse(text: string, input: SellThroughInput): SellThroughPrediction {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      estimatedDaysToSell: Math.max(1, Math.round(parsed.estimatedDaysToSell)),
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || 'AI prediction',
    };
  } catch {
    return heuristicSellThrough(input);
  }
}

function heuristicSellThrough(input: SellThroughInput): SellThroughPrediction {
  let days = 30; // default
  let confidence = 0.3;

  if (input.bsr) {
    if (input.bsr < 10000) { days = 3; confidence = 0.6; }
    else if (input.bsr < 50000) { days = 7; confidence = 0.5; }
    else if (input.bsr < 200000) { days = 21; confidence = 0.4; }
    else if (input.bsr < 500000) { days = 60; confidence = 0.3; }
    else { days = 120; confidence = 0.2; }
  }

  // Adjust for competition
  if (input.fbaOfferCount && input.fbaOfferCount > 10) {
    days = Math.round(days * 1.5);
  }
  if (input.isAmazonSelling) {
    days = Math.round(days * 2);
  }

  return {
    estimatedDaysToSell: days,
    confidence,
    reasoning: `Heuristic estimate based on BSR${input.bsr ? ` #${input.bsr.toLocaleString()}` : ''} and ${input.fbaOfferCount ?? 'unknown'} FBA offers`,
  };
}
