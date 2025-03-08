import { PrismaClient } from "../generated/index.js";

declare global {
  // eslint-disable-next-line no-var
  var _hubPrisma: PrismaClient | undefined;
}

type PrismaConfig = {
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

// In development/test environments, we want to reuse the Prisma client
// to avoid connection pool issues during hot reloads
export function getPrismaClient(): PrismaClient {
  if (process.env["NODE_ENV"] === "production") {
    return createPrismaClient();
  }

  if (!global._hubPrisma) {
    global._hubPrisma = createPrismaClient();
  }

  return global._hubPrisma;
}
