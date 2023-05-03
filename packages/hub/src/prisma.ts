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
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global._prisma = prisma;
