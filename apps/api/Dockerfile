# ── Build stage ──────────────────────────────────
FROM node:20-slim AS build

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for workspace resolution
COPY apps/api/package.json apps/api/
COPY apps/api/nest-cli.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/ai/package.json packages/ai/
COPY tooling/tsconfig/ tooling/tsconfig/

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/ai/ packages/ai/
COPY apps/api/ apps/api/

# Generate Prisma client and build all packages
RUN pnpm --filter @sourcetool/db run db:generate
RUN pnpm --filter @sourcetool/db run build
RUN pnpm --filter @sourcetool/shared run build
RUN pnpm --filter @sourcetool/ai run build
RUN pnpm --filter @sourcetool/api run build

# Prune dev dependencies
RUN pnpm prune --prod

# ── Production stage ─────────────────────────────
FROM node:20-slim AS production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace structure with production deps
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Copy built API
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

# Copy built shared packages
COPY --from=build /app/packages/db/dist ./packages/db/dist
COPY --from=build /app/packages/db/package.json ./packages/db/
COPY --from=build /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/
COPY --from=build /app/packages/ai/dist ./packages/ai/dist
COPY --from=build /app/packages/ai/package.json ./packages/ai/

# Copy Prisma schema + migrations for migrate deploy
COPY --from=build /app/packages/db/prisma ./packages/db/prisma

# Copy generated Prisma client (custom output path)
COPY --from=build /app/packages/db/generated ./packages/db/generated

ENV NODE_ENV=production

WORKDIR /app/apps/api

# Run migrations then start
CMD ["sh", "-c", "cd /app/packages/db && npx prisma migrate deploy && cd /app/apps/api && node dist/main"]
