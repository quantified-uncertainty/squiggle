# ================================ Base image ================================

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
    && apt-get upgrade -y \
    && apt-get install -y --no-install-recommends openssl

# Prepare the package manager used by the workspace before installing dependencies.
RUN npm install -g npm@11.21.0 corepack@0.36.0 turbo@2.4.4 \
    && corepack enable \
    && corepack prepare pnpm@10.34.7 --activate

# Workspace overrides do not cover npm's bundled dependencies.
# Install their compatible security patches with their own nested dependencies.
RUN npm install --prefix /tmp/npm-security-patches --install-strategy=nested \
        --ignore-scripts --no-audit --no-fund \
        brace-expansion@5.0.12 ip-address@10.7.4 \
        postcss-selector-parser@7.1.6 undici@6.28.1 \
    && npm_vendor_dir="$(npm root -g)/npm/node_modules" \
    && for package in brace-expansion ip-address postcss-selector-parser undici; do \
        rm -rf "${npm_vendor_dir}/${package}"; \
        cp -a "/tmp/npm-security-patches/node_modules/${package}" "${npm_vendor_dir}/${package}"; \
    done \
    && rm -rf /tmp/npm-security-patches

# ================================ Builder ================================
# Pruned files
FROM base AS builder
WORKDIR /app
COPY . .
RUN turbo prune @quri/hub --docker

# ================================ Runner ================================

# Install dependencies and build
FROM base AS runner
WORKDIR /app

COPY --from=builder /app/out/json/ .
# TODO: --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/out/full/ .

WORKDIR /app/apps/hub

RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN \
    --mount=type=secret,id=TURBO_TEAM,env=TURBO_TEAM \
    turbo run bundle

# TODO - ship only `dist` directory, without `node_modules` and other code
