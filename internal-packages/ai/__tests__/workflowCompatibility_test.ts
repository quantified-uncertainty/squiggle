import { PromptArtifact } from "../src/Artifact.js";
import { calculatePriceMultipleCalls } from "../src/LLMClient/index.js";
import { makeAiCodec } from "../src/serialization.js";
import { createSquiggleWorkflowTemplate } from "../src/workflows/createSquiggleWorkflowTemplate.js";
import {
  llmConfigDefault,
  llmConfigSchema,
} from "../src/workflows/Workflow.js";

test.each([
  "Claude-Sonnet-5",
  "Gemini-3-1-Pro-Preview",
  "DeepSeek-V4-Pro",
  "Kimi-K2-7-Code",
  "MiniMax-M3",
  "GPT-6-1-Sol",
  "GPT-6-Luna",
  "DeepSeek-V4-1-Flash-1017",
  "Kimi-K3",
] as const)("round trips saved workflow configuration for %s", (llmId) => {
  const credentials = {
    anthropicApiKey: "test-anthropic-key",
    openRouterApiKey: "test-openrouter-key",
  };
  const config = llmConfigSchema.parse({ ...llmConfigDefault, llmId });
  const workflow = createSquiggleWorkflowTemplate.instantiate({
    ...credentials,
    llmConfig: config,
    inputs: { prompt: new PromptArtifact("Return 42") },
  });
  const codec = makeAiCodec(credentials);
  const serializer = codec.makeSerializer();
  const entrypoint = serializer.serialize("workflow", workflow);
  const bundle = serializer.getBundle();

  const restored = codec.makeDeserializer(bundle).deserialize(entrypoint);

  expect(restored.llmConfig).toEqual(config);
  expect(JSON.stringify(bundle)).not.toContain(credentials.anthropicApiKey);
  expect(JSON.stringify(bundle)).not.toContain(credentials.openRouterApiKey);
});

test("preserves historical pricing while applying the new default model's rates", () => {
  const usage = {
    apiCalls: 1,
    inputTokens: 1_000_000,
    outputTokens: 1_000_000,
  };

  expect(
    calculatePriceMultipleCalls({
      "Claude-Sonnet-5": { ...usage, llmId: "Claude-Sonnet-5" },
    })
  ).toBe(18);
  expect(
    calculatePriceMultipleCalls({
      "Claude-Sonnet-5-5": { ...usage, llmId: "Claude-Sonnet-5-5" },
    })
  ).toBe(12);
});
