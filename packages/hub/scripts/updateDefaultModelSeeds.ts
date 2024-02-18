// import the PrismaClient instance
import { prisma } from "@/prisma";

async function updateDefaultModelSeeds() {
  try {
    // Start transaction to update all models with DEFAULT_SEED to UPDATED_SEED
    const updateResult = await prisma.model.updateMany({
      where: {
        seed: "DEFAULT_SEED",
      },
      data: {
        seed: "UPDATED_SEED",
      },
    });

    console.log(`Updated ${updateResult.count} models.`);
  } catch (error) {
    console.error("Failed to update model seeds:", error);
  }
}

// Execute the script
updateDefaultModelSeeds();
