import { LlmConfig, LlmId } from "@quri/squiggle-ai";
import { SquiggleWorkflow } from "@quri/squiggle-ai/server";

import { createRequestBodySchema, requestToInput } from "../../utils";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const request = createRequestBodySchema.parse(body);

    if (!request.prompt && !request.squiggleCode) {
      throw new Error("Prompt or Squiggle code is required");
    }

    // Create a SquiggleGenerator instance
    const llmConfig: LlmConfig = {
      llmId: (request.model as LlmId) ?? "Claude-Sonnet",
      priceLimit: 0.3,
      durationLimitMinutes: 4,
      messagesInHistoryToKeep: 4,
    };

    const stream = new SquiggleWorkflow({
      llmConfig,
      input: requestToInput(request),
      abortSignal: req.signal,
      openaiApiKey: process.env["OPENROUTER_API_KEY"],
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    }).runAsStream();

    return new Response(stream as ReadableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response("Generation stopped", { status: 499 });
    }
    console.error("Error in POST function:", error);
    return new Response(
      JSON.stringify({
        error: "An error occurred while processing the request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
