import { PrismaClient } from "../generated/index.js";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var _metaforecastPrisma: PrismaClient | undefined;
}

export const prisma =
  global._metaforecastPrisma ||
  new PrismaClient({
    // log: ["query"],
  });

if (process.env["NODE_ENV"] !== "production")
  global._metaforecastPrisma = prisma;
