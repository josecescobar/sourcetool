import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { isAuthorizedCron } from './cron-auth';

function reqWithAuth(auth?: string): Request {
  const headers = new Headers();
  if (auth !== undefined) headers.set('authorization', auth);
  return new Request('http://localhost/api/cron/check-watches', { headers });
}

const ORIGINAL = process.env.CRON_SECRET;

beforeEach(() => {
  process.env.CRON_SECRET = 'super-secret-value';
});

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = ORIGINAL;
});

describe('isAuthorizedCron', () => {
  it('accepts the correct bearer secret', () => {
    expect(isAuthorizedCron(reqWithAuth('Bearer super-secret-value'))).toBe(true);
  });

  it('rejects a wrong secret', () => {
    expect(isAuthorizedCron(reqWithAuth('Bearer wrong'))).toBe(false);
  });

  it('rejects a missing Authorization header', () => {
    expect(isAuthorizedCron(reqWithAuth(undefined))).toBe(false);
  });

  it('rejects when CRON_SECRET is not configured', () => {
    delete process.env.CRON_SECRET;
    expect(isAuthorizedCron(reqWithAuth('Bearer anything'))).toBe(false);
  });
});
