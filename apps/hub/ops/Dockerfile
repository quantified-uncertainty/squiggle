# Use the official Node.js 22 image for builds
ARG DOCKER_NODE_VERSION=22-bookworm-slim

FROM node:$DOCKER_NODE_VERSION AS base

WORKDIR /app

# Install OpenSSL - necessary for Prisma client
# Mount caches via https://stackoverflow.com/a/72851168
RUN --mount=type=cache,id=apt-lists,target=/var/lib/apt/lists,sharing=locked \
    --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get install -y openssl

# Install pnpm and turbo
RUN npm install -g pnpm@9.13.2

# FIXME - how to install the exact version from package.json?
RUN npm install -g turbo@2.4.4

# Pruned files
FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune @quri/hub --docker

# Install dependencies and build
FROM base AS runner
WORKDIR /app

COPY --from=builder /app/out/json/ .
# TODO: --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

WORKDIR /app/apps/hub
RUN turbo run bundle
