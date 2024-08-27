import { LlmConfig, SquiggleGenerator } from "../../../llmRunner/main";
import {
  CreateRequestBody,
  createRequestBodySchema,
  squiggleResponseSchema,
} from "../../utils/squiggleTypes";

export const maxDuration = 30;

export async function POST(req: Request) {
  const abortController = new AbortController();

  try {
    const body = await req.json();
    const { prompt, numPlaygrounds, squiggleCode }: CreateRequestBody =
      createRequestBodySchema.parse(body);

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    // Create a SquiggleGenerator instance
    const llmConfig: LlmConfig = {
      llmName: "Claude-Sonnet",
      priceLimit: 0.2,
      durationLimitMinutes: 1,
      messagesInHistoryToKeep: 4,
    };
    const generator = new SquiggleGenerator(prompt, llmConfig);

    // Run the generator steps until completion
    while (!(await generator.step())) {
      if (req.signal.aborted) {
        abortController.abort();
        break;
      }
    }

    const { totalPrice, runTimeMs, llmRunCount, code, isValid } =
      generator.getFinalResult();

    const response = {
      code,
      isValid,
      totalPrice,
      runTimeMs,
      llmRunCount,
    };

    // Validate the response using the schema
    const validatedResponse = squiggleResponseSchema.parse([response]);

    // Handle client disconnection
    req.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    return new Response(JSON.stringify(validatedResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error.name === "AbortError") {
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
