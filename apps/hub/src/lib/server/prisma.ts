import "server-only";

import { PrismaClient } from "@quri/hub-db";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _hubPrismaConfig: PrismaConfig;
  var _hubPrisma: PrismaClient | undefined;
}

type PrismaConfig = {
  logs: "none" | "query" | "query-with-params";
};

global._hubPrismaConfig = {
  logs: process.env.NODE_ENV === "test" ? "none" : "query",
};

function makePrisma() {
  const config = global._hubPrismaConfig;
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

  // FIXME - query-with-params mode causes duplicate log lines on code reloads.
  if (config.logs === "query-with-params") {
    (prisma as any).$on("query", async (e: any) => {
      console.log(`${e.query} ${e.params}`);
    });
  }

  return prisma;
}

export let prisma = global._hubPrisma || makePrisma();

// Single prisma instance for the entire app, in dev mode.
// This helps with connection leaks during hot reloads.
if (process.env.NODE_ENV !== "production") global._hubPrisma = prisma;

// This will work only in dev mode, and will be invoked only in dev mode.
export async function resetPrisma(config: PrismaConfig) {
  if (process.env.NODE_ENV === "production") return;
  global._hubPrismaConfig = config;
  await prisma.$disconnect();
  prisma = makePrisma();
  global._hubPrisma = prisma;
}
