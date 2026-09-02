#!/usr/bin/env node
'use strict';

/**
 * Prisma's schema requires DATABASE_URL + DIRECT_DATABASE_URL.
 * Hosted providers inject different names:
 *   Neon Vercel integration: DATABASE_URL, DATABASE_URL_UNPOOLED
 *   Vercel Postgres / Neon marketplace: POSTGRES_URL, POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL
 * This wrapper copies those into the Prisma keys before running a command.
 */

const PLACEHOLDER =
  'postgresql://sourcetool:sourcetool@localhost:5432/sourcetool?schema=public';

function resolveEnv(input = process.env, options = {}) {
  const env = { ...input };
  const allowPlaceholder = options.allowPlaceholder === true;

  const pooled =
    env.DATABASE_URL ||
    env.POSTGRES_PRISMA_URL ||
    env.POSTGRES_URL ||
    env.PRISMA_DATABASE_URL ||
    '';

  const unpooled =
    env.DIRECT_DATABASE_URL ||
    env.DATABASE_URL_UNPOOLED ||
    env.POSTGRES_URL_NON_POOLING ||
    '';

  if (pooled && !env.DATABASE_URL) env.DATABASE_URL = pooled;
  if (unpooled && !env.DIRECT_DATABASE_URL) env.DIRECT_DATABASE_URL = unpooled;
  if (env.DATABASE_URL && !env.DIRECT_DATABASE_URL) {
    env.DIRECT_DATABASE_URL = env.DATABASE_URL;
  }

  if (allowPlaceholder) {
    if (!env.DATABASE_URL) env.DATABASE_URL = PLACEHOLDER;
    if (!env.DIRECT_DATABASE_URL) env.DIRECT_DATABASE_URL = env.DATABASE_URL;
  }

  return env;
}

function parseArgs(argv) {
  const args = [...argv];
  let allowPlaceholder = false;
  while (args[0] === '--allow-placeholder' || args[0] === '--') {
    if (args[0] === '--allow-placeholder') allowPlaceholder = true;
    args.shift();
  }
  return { allowPlaceholder, command: args };
}

function main(argv = process.argv.slice(2)) {
  const { spawnSync } = require('node:child_process');
  const { allowPlaceholder, command } = parseArgs(argv);
  const env = resolveEnv(process.env, { allowPlaceholder });

  if (!env.DATABASE_URL || !env.DIRECT_DATABASE_URL) {
    console.error(
      'with-db-urls: set DATABASE_URL (or POSTGRES_URL) and, for migrations, ' +
        'DIRECT_DATABASE_URL (or DATABASE_URL_UNPOOLED / POSTGRES_URL_NON_POOLING).',
    );
    process.exit(1);
  }

  if (command.length === 0) {
    return 0;
  }

  const result = spawnSync(command[0], command.slice(1), {
    stdio: 'inherit',
    env,
  });
  return result.status ?? 1;
}

module.exports = { resolveEnv, parseArgs, PLACEHOLDER };

if (require.main === module) {
  process.exit(main());
}
