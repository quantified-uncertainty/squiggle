import { z } from "zod";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  PromptArtifact,
} from "@quri/squiggle-ai/server";

import { saveWorkflowToDb } from "@/ai/utils";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

import { getEvalRunnerById } from "./data/evalRunners";
import { EvalRunner } from "./types";

function specToPrompt(spec: { id: string; description: string }) {
  return `Write a model for this question: ${spec.description}. Return the answer in the final expression.`;
}

const configSchema = z.object({
  llmId: z.enum(MODEL_CONFIGS.map((m) => m.id) as [LlmId, ...LlmId[]]),
  priceLimit: z.number(),
  durationLimitMinutes: z.number(),
  messagesInHistoryToKeep: z.number(),
  numericSteps: z.number(),
  styleGuideSteps: z.number(),
});

export async function getAiEvalRunner({
  id,
}: {
  id: string;
}): Promise<EvalRunner> {
  const runnerData = await getEvalRunnerById(id);
  if (runnerData.type !== "SquiggleAI") {
    throw new Error("Eval runner is not an AI runner");
  }

  const llmConfig = configSchema.parse(runnerData.config);

  const evalRunner: EvalRunner = async (spec) => {
    const session = await getSessionOrRedirect();
    const user = await getSelf(session);

    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(specToPrompt(spec)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    await workflow.runToResult();

    // save only once
    const dbWorkflow = await saveWorkflowToDb(workflow, user, { final: true });

    const workflowResult = workflow.getFinalResult();

    return {
      specId: spec.id,
      code: workflowResult.code,
      workflowId: dbWorkflow.id,
    };
  };

  return evalRunner;
}
