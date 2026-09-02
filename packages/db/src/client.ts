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

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  const log: Array<'query' | 'error' | 'warn'> =
    process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'];

  // Neon serverless driver + Prisma adapter: one HTTP/WS connection per invocation
  // instead of a persistent TCP pool. Other Postgres (Supabase pooler, local) uses
  // the standard client with pgbouncer-friendly DATABASE_URL.
  if (isNeonUrl(connectionString)) {
    neonConfig.webSocketConstructor = ws;
    const adapter = new PrismaNeon({ connectionString: connectionString! });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
