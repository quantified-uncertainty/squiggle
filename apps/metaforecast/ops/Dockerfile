# Use the official Node.js 20 image for builds
ARG DOCKER_NODE_VERSION=20-bookworm-slim

FROM node:$DOCKER_NODE_VERSION AS build

WORKDIR /app

# Install OpenSSL - necessary for Prisma client
# Mount caches via https://stackoverflow.com/a/72851168
RUN --mount=type=cache,id=apt-lists,target=/var/lib/apt/lists,sharing=locked \
    --mount=type=cache,id=apt-cache,target=/var/cache/apt,sharing=locked \
    rm -f /etc/apt/apt.conf.d/docker-clean \
    && apt-get update \
    && apt-get install -y openssl

# Install pnpm globally
RUN npm install -g pnpm

COPY . .

# Install dependencies
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store/v3 pnpm install --frozen-lockfile

ENV NODE_ENV=production

RUN pnpm build
