import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { generateSeed } from "@quri/squiggle-lang";

import { DEFAULT_SEED } from "@/constants";

const prisma = new PrismaClient();

async function generateAndSetNewSeedForModels() {
  // Find all models
  const models = await prisma.model.findMany({
    include: {
      revisions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Only include the last revision
      },
    },
  });

  for (const model of models) {
    const lastRevision = model.revisions[0];

    // Check if the last revision has the DEFAULT_SEED
    if (lastRevision && lastRevision.seed === DEFAULT_SEED) {
      // Generate a random seed for the model
      const newSeed = generateSeed();

      // Update seed for all revisions of the current model
      await prisma.modelRevision.updateMany({
        where: { modelId: model.id },
        data: { seed: newSeed },
      });
    }
  }
}

export async function POST(req: NextRequest) {
  const adminToken = req.headers.get("x-admin-token");
  const secretToken = process.env["ADMIN_SECRET_TOKEN"];

  if (!secretToken || adminToken !== secretToken) {
    return new NextResponse(null, {
      status: 401,
      statusText: "Unauthorized access.",
    });
  }

  try {
    await generateAndSetNewSeedForModels();
    return new NextResponse(
      JSON.stringify({
        message:
          "Successfully updated seeds for models where the last revision had DEFAULT_SEED.",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("An error occurred:", error);
    return new NextResponse(
      JSON.stringify({
        error: "An error occurred while updating seeds.",
      }),
      { status: 500 }
    );
  }
}
