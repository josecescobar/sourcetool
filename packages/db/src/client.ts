import { PrismaClient } from '../generated/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function isNeonUrl(url: string | undefined) {
  return !!url && /neon\.tech|neon\.database/i.test(url);
}

/** Neon console URLs include flags that break Prisma (channel_binding) or the WS driver. */
function neonConnectionString(url: string, opts?: { forAdapter?: boolean }) {
  const parsed = new URL(url);
  parsed.searchParams.delete('channel_binding');
  parsed.searchParams.delete('pool_timeout');
  if (!parsed.searchParams.get('sslmode')) {
    parsed.searchParams.set('sslmode', 'require');
  }
  if (opts?.forAdapter) {
    parsed.searchParams.delete('pgbouncer');
    parsed.searchParams.delete('connection_limit');
  } else {
    parsed.searchParams.set('pgbouncer', 'true');
    if (!parsed.searchParams.get('connection_limit')) {
      parsed.searchParams.set('connection_limit', '1');
    }
  }
  return parsed.toString();
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const log: Array<'query' | 'error' | 'warn'> =
    process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

  // Vercel Node functions talk to Neon over TLS with the native query engine.
  // The serverless WS adapter is used locally / on Edge-like runtimes only —
  // it was terminating connections on Vercel anonymous/Node deployments.
  const useAdapter =
    isNeonUrl(connectionString) &&
    process.env.PRISMA_NEON_ADAPTER === '1' &&
    !process.env.VERCEL;

  if (useAdapter) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({
      connectionString: neonConnectionString(connectionString!, { forAdapter: true }),
    });
    return new PrismaClient({ adapter, log });
  }

  if (isNeonUrl(connectionString)) {
    return new PrismaClient({
      log,
      datasources: { db: { url: neonConnectionString(connectionString!) } },
    });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
