import { jest } from "@jest/globals";
import OpenAI, { type ClientOptions } from "openai";

// The older OpenAI SDK uses node-fetch by default. Route its real request
// serialization through the intercepted transport so these tests stay offline.
jest.unstable_mockModule("openai", () => ({
  default: class extends OpenAI {
    constructor(options: ClientOptions) {
      super({
        ...options,
        fetch: (input, init) => globalThis.fetch(input, init),
      });
    }
  },
}));

const { LLMClient } = await import("../src/LLMClient/index.js");

beforeEach(() => {
  jest
    .spyOn(globalThis, "fetch")
    .mockRejectedValue(new Error("Unexpected request"));
});

function mockCompletion(response: Record<string, unknown>) {
  let request: Request | undefined;
  jest.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    request = new Request(input, init);
    return Response.json(response);
  });
  return () => {
    if (!request) throw new Error("No provider request was made");
    return request;
  };
}

function openAICompletion(model: string) {
  return {
    id: "chatcmpl-test",
    object: "chat.completion",
    created: 1,
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: "```squiggle\n42\n```" },
        finish_reason: "stop",
      },
    ],
    usage: { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 },
  };
}

afterEach(() => jest.restoreAllMocks());

test.each([
  ["GPT-6-1-Sol", "openai/gpt-6.1-sol"],
  ["GPT-6-Luna", "openai/gpt-6-luna"],
  ["DeepSeek-V4-1-Flash-1017", "deepseek/deepseek-v4.1-flash-1017"],
  ["Kimi-K3", "moonshotai/kimi-k3"],
] as const)(
  "routes %s through OpenRouter without an OpenAI key",
  async (id, model) => {
    const getRequest = mockCompletion(openAICompletion(model));
    const client = new LLMClient(
      id,
      undefined,
      undefined,
      "test-openrouter-key"
    );

    const result = await client.run([{ role: "user", content: "Return 42" }]);

    const request = getRequest();
    expect(request.url).toBe("https://openrouter.ai/api/v1/chat/completions");
    expect(request.headers.get("authorization")).toBe(
      "Bearer test-openrouter-key"
    );
    expect(await request.json()).toMatchObject({
      model,
      max_tokens: 8192,
      reasoning: { effort: "low" },
    });
    expect(result.content).toBe("```squiggle\n42\n```");
    expect(result.model).toBe(model);
  }
);

test.each([
  ["Claude-Sonnet-5-5", "claude-sonnet-5-5"],
  ["Claude-Opus-5-5", "claude-opus-5-5"],
  ["Claude-Haiku-5-5", "claude-haiku-5-5"],
] as const)(
  "bounds reasoning for %s and extracts text after thinking blocks",
  async (id, model) => {
    const getRequest = mockCompletion({
      id: "msg-test",
      type: "message",
      role: "assistant",
      model,
      content: [
        { type: "thinking", thinking: "Check the answer", signature: "test" },
        { type: "text", text: "```squiggle" },
        { type: "text", text: "42\n```" },
      ],
      stop_reason: "end_turn",
      stop_sequence: null,
      usage: { input_tokens: 20, output_tokens: 10 },
    });
    const client = new LLMClient(id, undefined, "test-anthropic-key");

    const result = await client.run([{ role: "user", content: "Return 42" }]);

    const request = getRequest();
    expect(request.url).toBe("https://api.anthropic.com/v1/messages");
    expect(await request.json()).toMatchObject({
      model,
      max_tokens: 8192,
      output_config: { effort: "low" },
    });
    expect(result.content).toBe("```squiggle\n42\n```");
    expect(result.usage.total_tokens).toBe(30);
  }
);

test("retains the output limit for a saved OpenRouter model", async () => {
  const getRequest = mockCompletion(
    openAICompletion("google/gemini-3.1-pro-preview")
  );
  const client = new LLMClient(
    "Gemini-3-1-Pro-Preview",
    undefined,
    undefined,
    "test-openrouter-key"
  );

  await client.run([{ role: "user", content: "Return 42" }]);

  expect(await getRequest().json()).toMatchObject({
    model: "google/gemini-3.1-pro-preview",
    max_tokens: 8192,
    reasoning: { effort: "low" },
  });
});

test("does not send OpenRouter parameters to legacy direct OpenAI models", async () => {
  const getRequest = mockCompletion(openAICompletion("o1-mini-2024-09-12"));
  const client = new LLMClient("o1-mini", "test-openai-key");

  await client.run([{ role: "user", content: "Return 42" }]);

  expect(getRequest().url).toBe("https://api.openai.com/v1/chat/completions");
  const body = await getRequest().json();
  expect(body).not.toHaveProperty("reasoning");
  expect(body).not.toHaveProperty("max_tokens");
});

test("requires an OpenRouter key even when a direct OpenAI key is present", () => {
  expect(() => new LLMClient("GPT-6-1-Sol", "test-openai-key")).toThrow(
    "No openrouter API key provided"
  );
});
