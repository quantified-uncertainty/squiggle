import { LlmConfig } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  PromptArtifact,
} from "@quri/squiggle-ai/server";
import { run } from "@quri/squiggle-lang";

import { Evaluator } from "./index.js";

export async function getAiEvaluator(): Promise<Evaluator> {
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
        prompt: new PromptArtifact(
          `Write a model for this question: ${spec.description}. Return the answer in the `
        ),
      },
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    const workflowResult = await workflow.runToResult();
    const code = workflowResult.code;

    const squiggleModuleOutput = await run(code);

    const result = squiggleModuleOutput.result.ok
      ? squiggleModuleOutput.result.value.toString()
      : "Error";

    return {
      specId: spec.id,
      result: result,
    };
  };

  return evaluator;
}
