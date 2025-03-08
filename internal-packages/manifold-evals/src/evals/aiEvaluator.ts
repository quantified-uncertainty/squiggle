import fs from "fs/promises";
import path from "path";

import { LlmConfig, llmLinker } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  makeAiCodec,
  PromptArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";
import { run, SqValue } from "@quri/squiggle-lang";

import { Spec } from "../specLists.js";
import { EvalResult, Evaluator } from "./index.js";

function specToPrompt(spec: Spec) {
  return `Write a model for this question: ${spec.description}. Return the answer in the final expression.`;
}

export async function loadWorkflowFromFile(
  filePath: string
): Promise<Workflow<any>> {
  const codec = makeAiCodec({
    anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
  });

  const json = await fs.readFile(filePath, "utf-8");

  const { entrypoint, bundle } = JSON.parse(json);

  const deserializer = codec.makeDeserializer(bundle);

  const workflow = deserializer.deserialize<"workflow">(entrypoint);

  return workflow;
}

async function serializeWorkflowToFile(
  workflow: Workflow<any>,
  filePath: string
) {
  const codec = makeAiCodec({
    anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
  });
  const serializer = codec.makeSerializer();

  const entrypoint = serializer.serialize("workflow", workflow);
  const bundle = serializer.getBundle();

  const serializedWorkflow = JSON.stringify({ entrypoint, bundle });
  await fs.writeFile(filePath, serializedWorkflow);
}

function sqValueToString(value: SqValue): string {
  if (value.tag === "Dist" && value.context) {
    const env = value.context.runContext.environment;
    const sparkline = String(value.value.toSparkline(env).value);
    const mean = String(value.value.mean(env));
    return `${sparkline} Mean: ${mean}`;
  }
  return value.toString();
}

async function workflowStringResult(workflow: Workflow<any>): Promise<string> {
  const workflowResult = workflow.getFinalResult();
  const code = workflowResult.code;
  const squiggleModuleOutput = await run(code, {
    linker: llmLinker,
  });

  const result = squiggleModuleOutput.result.ok
    ? sqValueToString(squiggleModuleOutput.result.value.result)
    : squiggleModuleOutput.result.value.toString();

  return result;
}

export async function loadSpecEvalResult({
  dir,
  spec,
}: {
  dir: string;
  spec: Spec;
}): Promise<EvalResult> {
  const filePath = path.join(dir, `${spec.id}.json`);
  const workflow = await loadWorkflowFromFile(filePath);
  const result = await workflowStringResult(workflow);

  return {
    specId: spec.id,
    result,
  };
}

export async function getAiEvaluator({
  storeWorkflowsDir,
}: {
  storeWorkflowsDir?: string;
} = {}): Promise<Evaluator> {
  const llmConfig: LlmConfig = {
    llmId: "Claude-Sonnet",
    priceLimit: 0.8,
    durationLimitMinutes: 6,
    messagesInHistoryToKeep: 4,
    numericSteps: 1,
    styleGuideSteps: 1,
  };

  const evaluator: Evaluator = async (spec) => {
    const workflow = createSquiggleWorkflowTemplate.instantiate({
      llmConfig,
      inputs: {
        prompt: new PromptArtifact(specToPrompt(spec)),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    await workflow.runToResult();
    if (storeWorkflowsDir) {
      const workflowFile = path.join(storeWorkflowsDir, `${spec.id}.json`);
      await serializeWorkflowToFile(workflow, workflowFile);
    }
    const result = await workflowStringResult(workflow);

    return {
      specId: spec.id,
      result,
    };
  };

  return evaluator;
}
