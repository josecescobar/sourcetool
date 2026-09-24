import { describe, expect, it } from 'vitest';
import { resolveApiBaseUrl } from './api-client';

describe('resolveApiBaseUrl', () => {
  it('uses the same-origin Next.js API when no override is set', () => {
    expect(resolveApiBaseUrl(undefined, 'https://sourcetool.vercel.app')).toBe('/api');
  });

  it('keeps a relative API path', () => {
    expect(resolveApiBaseUrl('/api/', 'https://sourcetool.vercel.app')).toBe('/api');
  });

  it('drops a dead cross-origin host that iPhone Safari cannot call', () => {
    expect(
      resolveApiBaseUrl(
        'https://hopeful-abundance-production.up.railway.app/api',
        'https://sourcetool.vercel.app',
      ),
    ).toBe('/api');
  });

  it('keeps an absolute URL only when it matches the page origin', () => {
    expect(
      resolveApiBaseUrl('https://sourcetool.vercel.app/api/', 'https://sourcetool.vercel.app'),
    ).toBe('https://sourcetool.vercel.app/api');
  });
});
