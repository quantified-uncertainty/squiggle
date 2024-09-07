import {
  LlmConfig,
  runSquiggleGenerator,
} from "../../../llmRunner/squiggleGenerator";
import {
  CreateRequestBody,
  createRequestBodySchema,
} from "../../utils/squiggleTypes";

export const maxDuration = 500;

// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming
function iteratorToStream<T>(iterator: AsyncGenerator<T, void>) {
  return new ReadableStream({
    async pull(controller) {
      for await (const value of iterator) {
        controller.enqueue(JSON.stringify(value) + "\n");
      }
      controller.close();
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, squiggleCode }: CreateRequestBody =
      createRequestBodySchema.parse(body);

    console.log("Inputs", prompt, squiggleCode);

    if (!prompt && !squiggleCode) {
      throw new Error("Prompt or Squiggle code is required");
    }

    // Create a SquiggleGenerator instance
    const llmConfig: LlmConfig = {
      llmName: "Claude-Sonnet",
      priceLimit: 0.3,
      durationLimitMinutes: 4,
      messagesInHistoryToKeep: 4,
    };

    const generator = runSquiggleGenerator({
      input: squiggleCode
        ? { type: "Edit", code: squiggleCode }
        : { type: "Create", prompt: prompt ?? "" },
      llmConfig,
      abortSignal: req.signal,
      openaiApiKey: process.env["OPENROUTER_API_KEY"],
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    });

    return new Response(iteratorToStream(generator), {
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
