import { z } from "zod";

import { Prisma } from "@quri/hub-db";
import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  makeAiCodec,
  PromptArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser } from "@/users/auth";

import { Evaluator } from "./data/evals";
import { getEvaluatorById } from "./data/evaluators";

function specToPrompt(spec: { id: string; description: string }) {
  return `Write a model for this question: ${spec.description}. Return the answer in the final expression.`;
}

function serializeWorkflow(workflow: Workflow<any>): Prisma.InputJsonValue {
  const codec = makeAiCodec({
    anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
  });
  const serializer = codec.makeSerializer();

  const entrypoint = serializer.serialize("workflow", workflow);
  const bundle = serializer.getBundle();

  return { entrypoint, bundle };
}

async function saveWorkflowToDb(workflow: Workflow<any>): Promise<string> {
  const user = await checkRootUser();

  const serialized = serializeWorkflow(workflow);

  const dbWorkflow = await prisma.aiWorkflow.create({
    data: {
      id: workflow.id,
      format: "V2_0",
      workflow: serialized,
      markdown: workflow.getFinalResult().logSummary || "",
      user: {
        connect: {
          email: user.email,
        },
      },
    },
  });

  return dbWorkflow.id;
}

const configSchema = z.object({
  llmId: z.enum(MODEL_CONFIGS.map((m) => m.id) as [LlmId, ...LlmId[]]),
  priceLimit: z.number(),
  durationLimitMinutes: z.number(),
  messagesInHistoryToKeep: z.number(),
  numericSteps: z.number(),
  styleGuideSteps: z.number(),
});

export async function getAiEvaluator({
  id,
}: {
  id: string;
}): Promise<Evaluator> {
  const evaluatorData = await getEvaluatorById(id);
  if (evaluatorData.type !== "SquiggleAI") {
    throw new Error("Evaluator is not an AI evaluator");
  }

  const llmConfig = configSchema.parse(evaluatorData.config);

  const evaluator: Evaluator = async (spec) => {
    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(specToPrompt(spec)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    await workflow.runToResult();

    const workflowId = await saveWorkflowToDb(workflow);

    const workflowResult = workflow.getFinalResult();

    return {
      specId: spec.id,
      code: workflowResult.code,
      workflowId,
    };
  };

  return evaluator;
}
