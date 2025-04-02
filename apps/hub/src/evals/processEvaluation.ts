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
      questionSet: {
        include: {
          questions: {
            include: {
              question: true,
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
    const runner = await getAiEvalRunner({ id: evaluation.agentId });
    if (!runner) {
      throw new Error(`Failed to get runner with ID ${evaluation.agentId}`);
    }

    // Process all specs in parallel
    await Promise.all(
      fullEvaluation.questionSet.questions.map(async ({ question }) => {
        try {
          console.log(
            `Processing question ${question.id} for evaluation ${evaluation.id}...`
          );
          const result = await runner(question);

          // Store result in db
          await prisma.value.create({
            data: {
              question: {
                connect: {
                  id: question.id,
                },
              },
              code: result.code,
              evaluation: {
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
          console.error(`Error processing question ${question.id}:`, error);
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
