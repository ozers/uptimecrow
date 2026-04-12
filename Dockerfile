# ── Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Dependencies ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Development ──
FROM deps AS development
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["pnpm", "dev"]

# ── Build ──
FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @uptimecrow/shared build
WORKDIR /app/apps/api
RUN pnpm build

# ── Production ──
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared ./packages/shared
COPY apps/api/package.json ./apps/api/
COPY apps/api/drizzle.config.ts ./apps/api/
COPY apps/api/drizzle/ ./apps/api/drizzle/
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["/bin/sh", "-c", "node /app/apps/api/dist/db/migrate.js && node /app/apps/api/dist/index.js"]
