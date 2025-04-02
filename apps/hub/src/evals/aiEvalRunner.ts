import { z } from "zod";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  PromptArtifact,
} from "@quri/squiggle-ai/server";

import { saveWorkflowToDb } from "@/ai/utils";
import { getSelf, getSessionOrRedirect } from "@/users/auth";

import { getEpistemicAgentById } from "./data/epistemicAgents";
import { EvalRunner } from "./types";

function questionToPrompt(question: { id: string; description: string }) {
  return `Write a model for this question: ${question.description}. Return the answer in the final expression.`;
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
  const agentData = await getEpistemicAgentById(id);
  if (agentData.type !== "SquiggleAI") {
    throw new Error("Epistemic agent is not an AI agent");
  }

  const llmConfig = configSchema.parse(agentData.config);

  const runner: EvalRunner = async (question) => {
    const session = await getSessionOrRedirect();
    const user = await getSelf(session);

    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(questionToPrompt(question)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
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

  return runner;
}
