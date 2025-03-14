import { Eval } from "@quri/hub-db";

/**
 * This function is usually called from a backend script; it's too slow for server actions or API routes.
 */
export async function processEvaluation(evaluation: Eval) {
  console.log(`Processing evaluation ${evaluation.id}...`);

  try {
    // Update the state to Running
    await prisma.eval.update({
      where: { id: evaluation.id },
      data: { state: "Running" },
    });

    // Get the evaluator
    const evaluator = await getAiEvaluator({ id: evaluation.evaluatorId });
    if (!evaluator) {
      throw new Error(
        `Failed to get evaluator with ID ${evaluation.evaluatorId}`
      );
    }

    // Process all specs in parallel
    await Promise.all(
      evaluation.specList.specs.map(async ({ spec }) => {
        try {
          console.log(
            `Processing spec ${spec.id} for evaluation ${evaluation.id}...`
          );
          const result = await evaluator(spec);

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
    await prisma.eval.update({
      where: { id: evaluation.id },
      data: { state: "Completed" },
    });

    console.log(`Successfully completed evaluation ${evaluation.id}`);
  } catch (error) {
    console.error(`Error processing evaluation ${evaluation.id}:`, error);

    // Update the state to Failed and store the error message
    await prisma.eval.update({
      where: { id: evaluation.id },
      data: {
        state: "Failed",
        errorMsg: error instanceof Error ? error.message : String(error),
      },
    });
  }
}
