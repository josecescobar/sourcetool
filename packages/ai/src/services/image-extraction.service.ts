import { getAnthropicClient } from '../providers/anthropic.provider';
import { EXTRACTION_SYSTEM_PROMPT } from '../prompts/extraction.prompt';
import type {
  ExtractionResult,
  IdentifierKind,
  ImageExtractionInput,
} from '@sourcetool/shared';

// Vision is cheap + low-latency on Haiku, which is plenty for reading a barcode
// or an ASIN off a screenshot. Override via options.model if needed.
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const VALID_KINDS: IdentifierKind[] = ['asin', 'upc', 'ean', 'title'];

/**
 * Run Claude vision on a single image and return the product identifier (plus
 * optional retail price / store) read from it. Returns null when nothing is
 * identifiable or the model output can't be parsed. Only throws on transport /
 * auth errors so callers can distinguish "failed" from "nothing found".
 *
 * The Anthropic key is read server-side from the shared provider — callers
 * never handle it.
 */
export async function extractProductFromImage(
  image: ImageExtractionInput,
  options?: { model?: string }
): Promise<ExtractionResult | null> {
  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: options?.model ?? DEFAULT_MODEL,
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: EXTRACTION_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: image.mediaType,
              data: image.base64,
            },
          },
          { type: 'text', text: 'Extract per the schema.' },
        ],
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;
  return parseExtractionJson(textBlock.text);
}

/**
 * Parse and validate the model's JSON response. Tolerant of markdown fences;
 * returns null on any structural problem rather than throwing.
 */
export function parseExtractionJson(text: string): ExtractionResult | null {
  const stripped = stripFences(text).trim();
  if (!stripped) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;

  const idRaw = obj.identifier;
  let identifier: ExtractionResult['identifier'] = null;

  if (idRaw && typeof idRaw === 'object') {
    const kind = (idRaw as Record<string, unknown>).kind;
    const value = (idRaw as Record<string, unknown>).value;
    if (
      typeof kind === 'string' &&
      VALID_KINDS.includes(kind as IdentifierKind) &&
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      identifier = { kind: kind as IdentifierKind, value: value.trim() };
    } else {
      return null;
    }
  } else if (idRaw !== null && idRaw !== undefined) {
    return null;
  }

  const result: ExtractionResult = { identifier };
  if (typeof obj.retailPriceCents === 'number' && obj.retailPriceCents >= 0) {
    result.retailPriceCents = Math.round(obj.retailPriceCents);
  }
  if (typeof obj.storeName === 'string' && obj.storeName.trim()) {
    result.storeName = obj.storeName.trim();
  }
  if (typeof obj.notes === 'string' && obj.notes.trim()) {
    result.notes = obj.notes.trim();
  }
  return result;
}

function stripFences(text: string): string {
  // Remove ```json ... ``` fences if the model added them despite instructions.
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = text.trim().match(fence);
  return match?.[1] ?? text;
}
