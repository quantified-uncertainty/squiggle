import { Evaluation } from "@quri/hub-db";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { toQuestionDTO } from "../data/questions";
import { getEpistemicAgentRunner } from "./runners";

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
    const runner = await getEpistemicAgentRunner({ id: evaluation.agentId });

    // Process questions with a concurrency limit of 5
    const questions = fullEvaluation.questionSet.questions.map((question) =>
      toQuestionDTO(question.question)
    );
    const concurrencyLimit = 5;

    // Process questions in batches
    for (let i = 0; i < questions.length; i += concurrencyLimit) {
      const batch = questions.slice(i, i + concurrencyLimit);

      console.log(`Processing batch ${i} of ${questions.length}...`);
      await Promise.all(
        batch.map(async (question) => {
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
    }

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
