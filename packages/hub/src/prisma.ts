import { PrismaClient } from "@prisma/client";

// This config helps with connection leaks during hot reload
// (which we don't have in server.ts yet, but might in the future.)

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _prisma: PrismaClient | undefined;
}

export const prisma =
  global._prisma ||
  new PrismaClient({
    log: [
      {
        emit: "event",
        level: "query",
      },
    ],
  });

// TODO: This prints each query multiple times, more than basic `log: ["query"]` mode, investigate
// Prisma types are weird, using `any`
(prisma as any).$on("query", async (e: any) => {
  if (process.env.NODE_ENV === "test") {
    return; // logs are too verbose for jest
  }
  console.log(`${e.query} ${e.params}`);
});

if (process.env.NODE_ENV !== "production") global._prisma = prisma;
