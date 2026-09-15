'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { resolveEnv, parseArgs, PLACEHOLDER } = require('./with-db-urls.cjs');

describe('resolveEnv', () => {
  it('copies Neon unpooled alias into DIRECT_DATABASE_URL', () => {
    const env = resolveEnv({
      DATABASE_URL: 'postgresql://pooler/db',
      DATABASE_URL_UNPOOLED: 'postgresql://direct/db',
    });
    assert.equal(env.DIRECT_DATABASE_URL, 'postgresql://direct/db');
    assert.equal(env.DATABASE_URL, 'postgresql://pooler/db');
  });

  it('copies Vercel Postgres aliases', () => {
    const env = resolveEnv({
      POSTGRES_PRISMA_URL: 'postgresql://prisma/db',
      POSTGRES_URL_NON_POOLING: 'postgresql://direct/db',
    });
    assert.equal(env.DATABASE_URL, 'postgresql://prisma/db');
    assert.equal(env.DIRECT_DATABASE_URL, 'postgresql://direct/db');
  });

  it('falls back DIRECT to DATABASE_URL when only pooled is set', () => {
    const env = resolveEnv({ DATABASE_URL: 'postgresql://only/db' });
    assert.equal(env.DIRECT_DATABASE_URL, 'postgresql://only/db');
  });

  it('uses a placeholder when allowed and nothing is set', () => {
    const env = resolveEnv({}, { allowPlaceholder: true });
    assert.equal(env.DATABASE_URL, PLACEHOLDER);
    assert.equal(env.DIRECT_DATABASE_URL, PLACEHOLDER);
  });

  it('does not invent URLs without --allow-placeholder', () => {
    const env = resolveEnv({});
    assert.equal(env.DATABASE_URL, undefined);
    assert.equal(env.DIRECT_DATABASE_URL, undefined);
  });
});

describe('parseArgs', () => {
  it('strips flags before the command', () => {
    const parsed = parseArgs(['--allow-placeholder', '--', 'prisma', 'generate']);
    assert.equal(parsed.allowPlaceholder, true);
    assert.deepEqual(parsed.command, ['prisma', 'generate']);
  });
});
