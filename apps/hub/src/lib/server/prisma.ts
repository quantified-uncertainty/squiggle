import "server-only";

import { getPrismaClient, type PrismaConfig } from "@quri/hub-db";

// Simply use the shared getPrismaClient implementation
export let prisma = getPrismaClient();

// This function is still needed for tests
export async function resetPrisma(config: PrismaConfig) {
  if (process.env.NODE_ENV === "production") return;

  // Disconnect the current client
  await prisma.$disconnect();

  // Clear the global instance so getPrismaClient will create a new one
  // @ts-ignore - we know this global exists
  global._hubPrisma = undefined;

  // Update the exported prisma instance
  prisma = getPrismaClient(config);
}
