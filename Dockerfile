# Admin / platform console (soul-thread-admin) - Next.js, self-hosted.
# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS deps
WORKDIR /app
# yarn.lock is the tracked lockfile — see .gitignore. A stray package-lock.json
# can exist locally but isn't committed; don't build from it.
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time, not read at container start —
# must come in as build args here, with matching values in docker-compose's
# build.args (docker-compose.yml).
ARG NEXT_PUBLIC_PLATFORM_DOMAIN
ARG NEXT_PUBLIC_PLATFORM_NAME
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_PLATFORM_DOMAIN=$NEXT_PUBLIC_PLATFORM_DOMAIN
ENV NEXT_PUBLIC_PLATFORM_NAME=$NEXT_PUBLIC_PLATFORM_NAME
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
RUN corepack enable && yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs

# .next/cache doesn't exist in the standalone output — Next creates it lazily
# at runtime for the ISR/prerender cache. Everything COPY'd below defaults to
# root-owned, and USER nextjs below can't write under root-owned /app, so
# without this the very first ISR write 500s with EACCES (hit this exact bug
# on the storefront first). Create it with the right owner up front instead.
RUN mkdir -p .next/cache && chown nextjs:nodejs .next .next/cache

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3002
ENV PORT=3002
# Docker auto-sets HOSTNAME to the container's short ID; the standalone
# server.js binds to process.env.HOSTNAME if set, so without this override it
# tries (and fails) to DNS-resolve the container ID as a bind address — hit
# this exact bug on the storefront container first.
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
