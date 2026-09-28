import { generateWithClaude } from './providers/anthropic.provider';
import { generateWithOpenAI } from './providers/openai.provider';
import { generateWithVercelGateway } from './providers/vercel-gateway.provider';

/** Paid providers. `off` is not a provider — it is the fail-closed default. */
export type AIProvider = 'anthropic' | 'openai' | 'vercel';

export type SourceToolAIProviderSetting = 'off' | AIProvider;

export const AI_VERDICT_OFF_MESSAGE = 'AI verdict is off';

export type ProviderCall = (
  systemPrompt: string,
  userMessage: string,
  options: { temperature: number; maxTokens: number },
) => Promise<string>;

export interface ProviderFns {
  anthropic: ProviderCall;
  openai: ProviderCall;
  vercel: ProviderCall;
}

export interface ProviderDeps {
  env?: Record<string, string | undefined>;
  fns?: ProviderFns;
}

export const defaultProviderFns: ProviderFns = {
  anthropic: generateWithClaude,
  openai: generateWithOpenAI,
  vercel: generateWithVercelGateway,
};

const PAID_PROVIDERS = new Set<AIProvider>(['anthropic', 'openai', 'vercel']);

/**
 * SOURCETOOL_AI_PROVIDER is the only switch. Unset, empty, `off`, or any
 * unknown value is off. A function argument cannot turn a paid provider on.
 */
export function resolveSourceToolAIProvider(
  env: Record<string, string | undefined> = process.env,
): SourceToolAIProviderSetting {
  const raw = (env.SOURCETOOL_AI_PROVIDER ?? '').trim().toLowerCase();
  if (PAID_PROVIDERS.has(raw as AIProvider)) return raw as AIProvider;
  return 'off';
}

export function isAIVerdictOff(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return resolveSourceToolAIProvider(env) === 'off';
}

/**
 * Call the single enabled provider, or return null so the caller uses its
 * heuristic. Never calls a second provider. Off/unset logs one debug line
 * and makes no provider call.
 */
export async function callEnabledProvider(opts: {
  service: string;
  systemPrompt: string;
  userMessage: string;
  temperature: number;
  maxTokens: number;
  env?: Record<string, string | undefined>;
  fns?: ProviderFns;
}): Promise<string | null> {
  const env = opts.env ?? process.env;
  const selected = resolveSourceToolAIProvider(env);
  if (selected === 'off') {
    console.debug(
      `[sourcetool-ai] ${opts.service}: ${AI_VERDICT_OFF_MESSAGE}; heuristic only, no network call`,
    );
    return null;
  }

  const fns = opts.fns ?? defaultProviderFns;
  try {
    return await fns[selected](opts.systemPrompt, opts.userMessage, {
      temperature: opts.temperature,
      maxTokens: opts.maxTokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'provider failed';
    console.debug(
      `[sourcetool-ai] ${opts.service}: ${selected} failed; heuristic only, no second provider. ${message}`,
    );
    return null;
  }
}
