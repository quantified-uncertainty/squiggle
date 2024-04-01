import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { generateSeed } from "@quri/squiggle-lang";

const prisma = new PrismaClient();

async function updateSquiggleSnippetsSeedForModels() {
  // Retrieve all models
  const models = await prisma.model.findMany({
    include: {
      revisions: {
        include: {
          squiggleSnippet: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  for (const model of models) {
    const lastRevision = model.revisions[0];

    // Check if the last revision's SquiggleSnippet has the DEFAULT_SEED
    if (
      lastRevision.squiggleSnippet &&
      lastRevision.squiggleSnippet.seed === "DEFAULT_SEED"
    ) {
      const newSeed = generateSeed();

      // Update all SquiggleSnippets for all revisions of the current model
      for (const revision of model.revisions) {
        if (revision.squiggleSnippet) {
          await prisma.squiggleSnippet.update({
            where: {
              id: revision.squiggleSnippet.id,
            },
            data: {
              seed: newSeed,
            },
          });
        }
      }
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
    await updateSquiggleSnippetsSeedForModels();
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
