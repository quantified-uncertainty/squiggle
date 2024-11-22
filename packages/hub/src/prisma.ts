/*
 * TODO - it would be good to `import "server-only"` here, as a precaution, but
 * this interferes with `tsx ./src/graphql/print-schema.ts`.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _prismaConfig: PrismaConfig;
  var _prisma: PrismaClient | undefined;
}

type PrismaConfig = {
  logs: "none" | "query" | "query-with-params";
};

global._prismaConfig = {
  logs: process.env.NODE_ENV === "test" ? "none" : "query",
};

function makePrisma() {
  const config = global._prismaConfig;
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
  (prisma as any).$on("query", async (e: any) => {
    console.log(`${e.query} ${e.params}`);
  });

  return prisma;
}

export let prisma = global._prisma || makePrisma();

// Single prisma instance for the entire app, in dev mode.
// This helps with connection leaks during hot reloads.
if (process.env.NODE_ENV !== "production") global._prisma = prisma;

// This will work only in dev mode, and will be invoked only in dev mode.
export async function resetPrisma(config: PrismaConfig) {
  if (process.env.NODE_ENV === "production") return;
  global._prismaConfig = config;
  await prisma.$disconnect();
  prisma = makePrisma();
  global._prisma = prisma;
}
