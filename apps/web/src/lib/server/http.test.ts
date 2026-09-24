import { describe, expect, it } from 'vitest';
import { handleRoute, isAllowedOrigin, jsonOk } from './http';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

function options(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost/api/thing', { method: 'OPTIONS', headers });
}

function get(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost/api/thing', { method: 'GET', headers });
}

describe('isAllowedOrigin', () => {
  it('allows the app origin and browser extensions', () => {
    expect(isAllowedOrigin(WEB_URL)).toBe(true);
    expect(isAllowedOrigin('chrome-extension://abcdef')).toBe(true);
    expect(isAllowedOrigin('moz-extension://abcdef')).toBe(true);
  });

  it('does not treat an absent or foreign origin as allowed', () => {
    expect(isAllowedOrigin(null)).toBe(false);
    expect(isAllowedOrigin('https://evil.example.com')).toBe(false);
  });
});

describe('handleRoute CORS', () => {
  const ok = handleRoute(async () => jsonOk({ hi: true }));

  it('preflight for an allowed origin returns 204 with the reflected origin', async () => {
    const res = await ok(options('chrome-extension://abcdef'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://abcdef');
  });

  it('preflight for a foreign origin is rejected with 403 and no CORS grant', async () => {
    const res = await ok(options('https://evil.example.com'));
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('reflects an allowed origin on a normal response', async () => {
    const res = await ok(get(WEB_URL));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(WEB_URL);
  });

  it('does not add a CORS grant for a foreign origin on a normal response', async () => {
    const res = await ok(get('https://evil.example.com'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
