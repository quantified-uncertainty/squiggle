import { z } from "zod";

import { prisma as metaforecastPrisma } from "@quri/metaforecast-db";
import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  PromptArtifact,
} from "@quri/squiggle-ai/server";

import { saveWorkflowToDb } from "@/ai/utils";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

import { getEpistemicAgentById } from "../data/epistemicAgents";
import { EvalRunner } from "../types";

function questionToPrompt(question: { id: string; description: string }) {
  return `Write a model for the following question. Return the answer in the final expression.

The answer should be either a single number or a probability distribution between 0 and 1.
  
Question:
${question.description}`;
}

const configSchema = z.object({
  llmId: z.enum(MODEL_CONFIGS.map((m) => m.id) as [LlmId, ...LlmId[]]),
  priceLimit: z.number(),
  durationLimitMinutes: z.number(),
  messagesInHistoryToKeep: z.number(),
  numericSteps: z.number(),
  styleGuideSteps: z.number(),
});

function getSquiggleAiRunner(
  llmConfig: z.infer<typeof configSchema>
): EvalRunner {
  return async (question) => {
    const session = await getSessionOrRedirect();
    const user = await getSelf(session);

    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(questionToPrompt(question)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
      openRouterApiKey: process.env["OPENROUTER_API_KEY"],
    });

    await workflow.runToResult();

    // save only once
    const dbWorkflow = await saveWorkflowToDb(workflow, user, { final: true });

    const workflowResult = workflow.getFinalResult();

    return {
      questionId: question.id,
      code: workflowResult.code,
      workflowId: dbWorkflow.id,
    };
  };
}

function getManifoldRunner(): EvalRunner {
  return async (question) => {
    const manifoldId = question.metadata.manifold?.marketId;
    if (!manifoldId) {
      throw new Error("Manifold market ID not found");
    }

    const market = await metaforecastPrisma.manifoldMarket.findUniqueOrThrow({
      where: {
        id: manifoldId,
      },
    });

    if (market.outcomeType !== "BINARY") {
      throw new Error("Manifold market is not a binary market");
    }

    if (market.isResolved) {
      return {
        questionId: question.id,
        code:
          market.resolution === "YES"
            ? "1"
            : market.resolution === "NO"
              ? "0"
              : '"unknown"',
        workflowId: null,
      };
    }

    return {
      questionId: question.id,
      code: `${market.probability}`,
      workflowId: null,
    };
  };
}

export async function getEpistemicAgentRunner({
  id,
}: {
  id: string;
}): Promise<EvalRunner> {
  const agentData = await getEpistemicAgentById(id);

  switch (agentData.type) {
    case "SquiggleAI": {
      const llmConfig = configSchema.parse(agentData.config);

      return getSquiggleAiRunner(llmConfig);
    }
    case "Manifold":
      return getManifoldRunner();
    default:
      throw new Error("Unsupported agent type");
  }
}
