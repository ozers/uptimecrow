# ── Base ──
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Dependencies ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile

# ── Development ──
FROM deps AS development
COPY tsconfig.base.json ./
COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/
WORKDIR /app/apps/web
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# ── Build ──
FROM deps AS build
COPY tsconfig.base.json ./
COPY apps/web/ apps/web/
COPY packages/shared/ packages/shared/
RUN pnpm --filter @uptimecrow/shared build
WORKDIR /app/apps/web
RUN pnpm build

# ── Production ──
FROM nginx:alpine AS production
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "export RESOLVER=$(grep ^nameserver /etc/resolv.conf | head -1 | awk '{print $2}') && envsubst '${API_URL} ${RESOLVER}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
