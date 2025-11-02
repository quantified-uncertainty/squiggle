import { config } from "dotenv";

import { PromptArtifact } from "../../Artifact.js";
import { createSquiggleWorkflowTemplate } from "../../workflows/createSquiggleWorkflowTemplate.js";
import { DEFAULT_LLM_ID, LlmId } from "../../modelConfigs.js";

config();

async function main() {
  const prompt =
    "Generate a function that takes a list of numbers and returns the sum of the numbers";

  const llmConfig = {
    llmId: "GLM-4-6" as LlmId,
    priceLimit: 0.3,
    durationLimitMinutes: 1,
    messagesInHistoryToKeep: 4,
    numericSteps: 3,
    styleGuideSteps: 2,
  };

  const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
    await createSquiggleWorkflowTemplate
      .instantiate({
        inputs: {
          prompt: new PromptArtifact(prompt),
        },
        openaiApiKey: process.env["OPENAI_API_KEY"],
        anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
        openRouterApiKey: process.env["OPENROUTER_API_KEY"],
        llmConfig
      })
      .runToResult();

  const response = {
    code: typeof code === "string" ? code : "",
    isValid,
    totalPrice,
    runTimeMs,
    llmRunCount,
    logSummary,
  };

  console.log(JSON.stringify(response, null, 2));
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});
