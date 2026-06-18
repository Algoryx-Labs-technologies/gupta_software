# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Pin pnpm 9 (lockfile v9). Corepack otherwise pulls pnpm 11, which rejects
# recently published lockfile entries via minimumReleaseAge supply-chain checks.
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Build workspace packages ──────────────────────────────────────────────────
FROM deps AS build

COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Clean stale artifacts, build shared declarations first, then api.
RUN rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo \
    apps/api/dist apps/api/tsconfig.tsbuildinfo \
    && pnpm --filter @gupta/shared exec tsc --build --force \
    && test -f packages/shared/dist/index.js \
    && test -f packages/shared/dist/index.d.ts \
    && pnpm --filter api build

# Portable production bundle (api + prod deps + built shared)
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm deploy --filter=api --prod --legacy /prod/api

# ── Production runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY --from=build --chown=nodejs:nodejs /prod/api ./

USER nodejs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
