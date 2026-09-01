# ── Build stage ──────────────────────────────────
FROM node:20-slim AS build

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy package.json files for workspace resolution
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/db/package.json packages/db/
COPY tooling/tsconfig/ tooling/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/shared/ packages/shared/
COPY packages/ui/ packages/ui/
COPY packages/db/ packages/db/
COPY apps/web/ apps/web/

# Build shared packages first
RUN pnpm --filter @sourcetool/db run db:generate
RUN pnpm --filter @sourcetool/db run build
RUN pnpm --filter @sourcetool/shared run build
RUN pnpm --filter @sourcetool/ui run build

# Build Next.js (NEXT_PUBLIC_ vars must be available at build time)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter @sourcetool/web run build

# ── Production stage ─────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Copy standalone output (includes all needed node_modules)
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static

ENV NODE_ENV=production

WORKDIR /app/apps/web

CMD ["node", "server.js"]
