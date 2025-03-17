import { Evaluation } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { getAiEvalRunner } from "./aiEvalRunner";

/**
 * This function is usually called from a backend script; it's too slow for server actions or API routes.
 */
export async function processEvaluation(evaluation: Evaluation) {
  await checkRootUser();
  console.log(`Processing evaluation ${evaluation.id}...`);

  const fullEvaluation = await prisma.evaluation.findUniqueOrThrow({
    where: { id: evaluation.id },
    include: {
      specList: {
        include: {
          specs: {
            include: {
              spec: true,
            },
          },
        },
      },
    },
  });

  try {
    // Update the state to Running
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { state: "Running" },
    });

    // Get the runner
    const runner = await getAiEvalRunner({ id: evaluation.runnerId });
    if (!runner) {
      throw new Error(`Failed to get runner with ID ${evaluation.runnerId}`);
    }

    // Process all specs in parallel
    await Promise.all(
      fullEvaluation.specList.specs.map(async ({ spec }) => {
        try {
          console.log(
            `Processing spec ${spec.id} for evaluation ${evaluation.id}...`
          );
          const result = await runner(spec);

          // Store result in db
          await prisma.evalResult.create({
            data: {
              spec: {
                connect: {
                  id: spec.id,
                },
              },
              code: result.code,
              eval: {
                connect: {
                  id: evaluation.id,
                },
              },
              ...(result.workflowId
                ? {
                    workflow: {
                      connect: {
                        id: result.workflowId,
                      },
                    },
                  }
                : {}),
            },
          });
        } catch (error) {
          console.error(`Error processing spec ${spec.id}:`, error);
          throw error; // Re-throw to be caught by outer try/catch
        }
      })
    );

    // Update the state to Completed
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: { state: "Completed" },
    });

    console.log(`Successfully completed evaluation ${evaluation.id}`);
  } catch (error) {
    console.error(`Error processing evaluation ${evaluation.id}:`, error);

    // Update the state to Failed and store the error message
    await prisma.evaluation.update({
      where: { id: evaluation.id },
      data: {
        state: "Failed",
        errorMsg: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
