# ── Base ──
# Node 22 matches the web Dockerfile, the GitHub Actions runner, and the
# tested local environment. Node 24 introduced ESM/CJS interop changes
# that break drizzle-orm subpath resolution under tsc --moduleResolution
# bundler — do not bump without re-verifying the build.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate
WORKDIR /app

# ── Dependencies ──
# All workspace package.jsons must be present for pnpm to resolve peer
# dependencies correctly across the monorepo. Omitting apps/web here
# silently breaks drizzle-orm's peer resolution in apps/api.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Development ──
# @uptimecrow/shared resolves through its "main" (dist/index.js), and dist is
# gitignored, so it does not exist in a fresh checkout or in this image — the
# compose file only bind-mounts src. Building it on start is what makes
# `docker compose up`, the first command in the README, work from a clean clone.
# Editing packages/shared in dev needs a container restart to take effect.
FROM deps AS development
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY packages/shared/ packages/shared/
EXPOSE 3000
# Migrations run here for the same reason they run in the production stage: a
# fresh `docker compose up` against an existing volume otherwise starts against
# a schema that is missing columns, and every create fails with a 500.
CMD ["/bin/sh", "-c", "pnpm --filter @uptimecrow/shared build && cd apps/api && pnpm db:migrate:dev && pnpm dev"]

# ── Build ──
# The SPA is built here too: since the API serves it (src/web.ts), one image
# carries both and self-hosters run one container instead of app + nginx.
FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/api/ apps/api/
COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @uptimecrow/shared build
RUN pnpm --filter @uptimecrow/web build
WORKDIR /app/apps/api
RUN pnpm build

# ── Production ──
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/packages/shared ./packages/shared
# Served by the API at /. Located relative to the compiled module
# (dist/web.js → /app/web), so no start command or working directory can move
# it; WEB_ROOT overrides.
COPY --from=build /app/apps/web/dist ./web
COPY apps/api/package.json ./apps/api/
COPY apps/api/drizzle.config.ts ./apps/api/
COPY apps/api/drizzle/ ./apps/api/drizzle/
COPY package.json pnpm-workspace.yaml ./

# Run as an unprivileged user (SOC 2 / enterprise baseline). node:alpine ships
# a `node` user; give it ownership of the app tree.
RUN chown -R node:node /app
USER node

WORKDIR /app/apps/api
EXPOSE 3000

# Container-native health check so orchestrators (Compose, Kubernetes, Portainer)
# can detect an unhealthy process. Hits the deep /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null 2>&1 || exit 1

# node, not pnpm. Invoking pnpm here made corepack resolve and download a pnpm
# release on every container start — so startup needed the network, and the
# version it picked (newer than the one the image was built with) re-linked
# /app/node_modules without bcrypt's native binding. The API then crash-looped
# on `Cannot find module bcrypt_lib.node`, which meant nobody could register or
# log in on a self-hosted install.
CMD ["/bin/sh", "-c", "node /app/apps/api/dist/db/migrate.js && node /app/apps/api/dist/index.js"]
