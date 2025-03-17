import { PrismaClient } from "../generated/index.js";

/**
 * This file is contained in this package instead of apps/hub, because sometimes it can be useful to access the Prisma client from other apps or CLI scripts.
 *
 * Note that CLI scripts usefulness is limited by the fact that they don't have access to the Next.js runtime environment, e.g. auth context.
 */

declare global {
  // eslint-disable-next-line no-var
  var _hubPrisma: PrismaClient | undefined;
}

export type PrismaConfig = {
  logs: "none" | "query" | "query-with-params";
};

const defaultConfig: PrismaConfig = {
  logs: process.env["NODE_ENV"] === "test" ? "none" : "query",
};

function createPrismaClient(
  config: PrismaConfig = defaultConfig
): PrismaClient {
  const prisma = new PrismaClient({
    log:
      config.logs === "none"
        ? []
        : config.logs === "query"
          ? ["query"]
          : [
              {
                emit: "event",
                level: "query",
              },
            ],
  });

  if (config.logs === "query-with-params") {
    (prisma as any).$on("query", async (e: any) => {
      console.log(`${e.query} ${e.params}`);
    });
  }

  return prisma;
}

/**
 * In development/test environments, we want to reuse the Prisma client
 * to avoid connection pool issues during hot reloads.
 */
export function getPrismaClient(
  config: PrismaConfig = defaultConfig
): PrismaClient {
  if (process.env["NODE_ENV"] === "production") {
    return createPrismaClient(config);
  }

  if (!global._hubPrisma) {
    global._hubPrisma = createPrismaClient(config);
  }

  return global._hubPrisma;
}
