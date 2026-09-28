import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DealScoreInput } from '@sourcetool/shared';
import { scoreDeal } from './services/deal-scoring.service';
import { predictSellThrough } from './services/sell-through-predictor.service';
import { inferRiskFlags } from './services/risk-flags.service';
import { summarizeBulkScan } from './services/bulk-scan-summary.service';
import {
  AI_VERDICT_OFF_MESSAGE,
  callEnabledProvider,
  resolveSourceToolAIProvider,
  type ProviderFns,
} from './provider-switch';

const dealInput: DealScoreInput = {
  product: { title: 'Widget', category: 'Home' },
  profitability: { buyPrice: 10, sellPrice: 25, profit: 8, roi: 40, margin: 20, fees: 7 },
  competition: { offerCount: 4 },
};

function fns(): ProviderFns {
  return {
    anthropic: vi.fn(async () => '{"verdict":"BUY","score":90,"reasoning":"paid","factors":{"profitability":{"score":20,"note":"n"},"competition":{"score":20,"note":"n"},"demand":{"score":20,"note":"n"},"risk":{"score":20,"note":"n"}}}'),
    openai: vi.fn(async () => '{"verdict":"BUY","score":80,"reasoning":"openai"}'),
    vercel: vi.fn(async () => '{"verdict":"BUY","score":70,"reasoning":"vercel"}'),
  };
}

describe('SOURCETOOL_AI_PROVIDER', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to off when unset, empty, or unknown', () => {
    expect(resolveSourceToolAIProvider({})).toBe('off');
    expect(resolveSourceToolAIProvider({ SOURCETOOL_AI_PROVIDER: '' })).toBe('off');
    expect(resolveSourceToolAIProvider({ SOURCETOOL_AI_PROVIDER: 'off' })).toBe('off');
    expect(resolveSourceToolAIProvider({ SOURCETOOL_AI_PROVIDER: 'claude' })).toBe('off');
  });

  it('makes no provider call when off, even if a caller asks for anthropic', async () => {
    const providers = fns();
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    const result = await scoreDeal(dealInput, 'anthropic', {
      env: { ANTHROPIC_API_KEY: 'should-not-be-used', OPENAI_API_KEY: 'nope' },
      fns: providers,
    });

    expect(result.reasoning).toContain('Heuristic score');
    expect(providers.anthropic).not.toHaveBeenCalled();
    expect(providers.openai).not.toHaveBeenCalled();
    expect(providers.vercel).not.toHaveBeenCalled();
    expect(debug).toHaveBeenCalledTimes(1);
    expect(debug.mock.calls[0]?.[0]).toContain(AI_VERDICT_OFF_MESSAGE);
  });

  it('falls back to the heuristic when explicit anthropic has no key', async () => {
    const providers = fns();
    providers.anthropic = vi.fn(async () => {
      throw new Error('ANTHROPIC_API_KEY is not set');
    });
    const result = await scoreDeal(dealInput, undefined, {
      env: { SOURCETOOL_AI_PROVIDER: 'anthropic' },
      fns: providers,
    });

    expect(providers.anthropic).toHaveBeenCalledTimes(1);
    expect(providers.openai).not.toHaveBeenCalled();
    expect(providers.vercel).not.toHaveBeenCalled();
    expect(result.reasoning).toContain('Heuristic score');
  });

  it('does not call a second provider when the chosen one fails', async () => {
    const providers = fns();
    providers.vercel = vi.fn(async () => {
      throw new Error('gateway down');
    });
    const result = await callEnabledProvider({
      service: 'test',
      systemPrompt: 's',
      userMessage: 'u',
      temperature: 0,
      maxTokens: 8,
      env: {
        SOURCETOOL_AI_PROVIDER: 'vercel',
        ANTHROPIC_API_KEY: 'present',
        OPENAI_API_KEY: 'present',
      },
      fns: providers,
    });

    expect(result).toBeNull();
    expect(providers.vercel).toHaveBeenCalledTimes(1);
    expect(providers.anthropic).not.toHaveBeenCalled();
    expect(providers.openai).not.toHaveBeenCalled();
  });

  it('keeps sell-through, risk flags, and bulk scan off the network when unset', async () => {
    const providers = fns();
    const env = { ANTHROPIC_API_KEY: 'present', OPENAI_API_KEY: 'present', AI_GATEWAY_API_KEY: 'present' };
    const sell = await predictSellThrough(
      { title: 'Widget', sellPrice: 25 },
      'anthropic',
      { env, fns: providers },
    );
    const risks = await inferRiskFlags(
      { title: 'Widget', category: 'Home' },
      'openai',
      { env, fns: providers },
    );
    const summary = await summarizeBulkScan(
      {
        fileName: 'scan.csv',
        marketplace: 'US',
        fulfillmentType: 'FBA',
        totalRows: 2,
        successRows: 2,
        failedRows: 0,
        avgRoi: 10,
        avgProfit: 4,
        profitableCount: 1,
        strongBuyCount: 0,
        topWinners: [],
        topLosers: [],
      },
      'vercel',
      { env, fns: providers },
    );

    expect(sell.reasoning).toContain('Heuristic estimate');
    expect(risks.hazmat.flagged).toBe(false);
    expect(summary).toContain('Scanned 2 items');
    expect(providers.anthropic).not.toHaveBeenCalled();
    expect(providers.openai).not.toHaveBeenCalled();
    expect(providers.vercel).not.toHaveBeenCalled();
  });
});
