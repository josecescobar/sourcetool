import OpenAI from 'openai';

// Vercel AI Gateway exposes an OpenAI-compatible Chat Completions endpoint,
// so we reuse the `openai` client with a custom baseURL instead of raw fetch.
const GATEWAY_BASE_URL = 'https://ai-gateway.vercel.sh/v1';

// Free model on the Gateway — used unless a caller explicitly overrides it.
const DEFAULT_MODEL = 'minimax/minimax-m3-free';

let client: OpenAI | null = null;

export function getVercelGatewayClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set');
    }
    client = new OpenAI({ apiKey, baseURL: GATEWAY_BASE_URL });
  }
  return client;
}

export async function generateWithVercelGateway(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  }
): Promise<string> {
  const gateway = getVercelGatewayClient();

  const response = await gateway.chat.completions.create({
    model: options?.model ?? DEFAULT_MODEL,
    max_tokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.3,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from Vercel AI Gateway');
  }
  return content;
}
