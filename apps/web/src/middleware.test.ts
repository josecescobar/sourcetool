import { describe, expect, it } from 'vitest';
import { middleware } from './middleware';

const WEB_URL = process.env.WEB_URL || 'http://localhost:3000';

function preflight(origin?: string): Request {
  const headers = new Headers({
    'access-control-request-method': 'POST',
    'access-control-request-headers': 'authorization,content-type',
  });
  if (origin) headers.set('origin', origin);
  return new Request('http://localhost:3000/api/auth/login', { method: 'OPTIONS', headers });
}

describe('API preflight middleware', () => {
  it('grants CORS to the Chrome extension origin', () => {
    const res = middleware(preflight('chrome-extension://abcdef'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('chrome-extension://abcdef');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });

  it('grants CORS to the app origin', () => {
    const res = middleware(preflight(WEB_URL));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(WEB_URL);
  });

  it('rejects a foreign origin with no CORS grant', () => {
    const res = middleware(preflight('https://evil.example.com'));
    expect(res.status).toBe(403);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('lets non-OPTIONS requests through', () => {
    const res = middleware(new Request('http://localhost:3000/api/health'));
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });
});
