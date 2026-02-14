FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files for workspace resolution
COPY apps/api/package.json apps/api/
COPY apps/api/nest-cli.json apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY packages/db/package.json packages/db/
COPY packages/shared/package.json packages/shared/
COPY packages/ai/package.json packages/ai/
COPY tooling/tsconfig/ tooling/tsconfig/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/db/ packages/db/
COPY packages/shared/ packages/shared/
COPY packages/ai/ packages/ai/
COPY apps/api/ apps/api/

# Generate Prisma client and build
RUN pnpm --filter @sourcetool/db run db:generate
RUN pnpm --filter @sourcetool/db run build
RUN pnpm --filter @sourcetool/shared run build 2>/dev/null || true
RUN pnpm --filter @sourcetool/ai run build 2>/dev/null || true
RUN pnpm --filter @sourcetool/api run build

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main"]
