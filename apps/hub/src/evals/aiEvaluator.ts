import { getPrismaClient, Prisma } from "@quri/hub-db";
import { LlmConfig } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  makeAiCodec,
  PromptArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";

import { Evaluator } from "./data/evals";

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
  // Create a stub user if we don't have user data
  const evaluatorUserEmail = process.env["EVALUATOR_USER_EMAIL"];
  if (!evaluatorUserEmail) {
    throw new Error("EVALUATOR_USER_EMAIL is not set");
  }

  const serialized = serializeWorkflow(workflow);

  const dbWorkflow = await getPrismaClient().aiWorkflow.create({
    data: {
      id: workflow.id,
      format: "V2_0",
      workflow: serialized,
      markdown: workflow.getFinalResult().logSummary || "",
      user: {
        connect: {
          email: evaluatorUserEmail,
        },
      },
    },
  });

  return dbWorkflow.id;
}
const llmConfig: LlmConfig = {
  llmId: "Claude-Sonnet",
  priceLimit: 0.8,
  durationLimitMinutes: 6,
  messagesInHistoryToKeep: 4,
  numericSteps: 1,
  styleGuideSteps: 1,
};

export async function getAiEvaluator({
  storeInDb = true,
}: {
  storeInDb?: boolean;
} = {}): Promise<Evaluator> {
  const evaluator: Evaluator = async (spec) => {
    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(specToPrompt(spec)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    await workflow.runToResult();

    // Store workflow to database if enabled
    let workflowId = workflow.id;
    if (storeInDb) {
      workflowId = await saveWorkflowToDb(workflow);
    }

    const workflowResult = workflow.getFinalResult();

    return {
      specId: spec.id,
      code: workflowResult.code,
      workflowId,
    };
  };

  return evaluator;
}
