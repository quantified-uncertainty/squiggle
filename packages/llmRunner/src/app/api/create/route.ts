import { LlmConfig, runSquiggleGenerator } from "../../../llmRunner/main";
import {
  CreateRequestBody,
  createRequestBodySchema,
  SquiggleResponse,
} from "../../utils/squiggleTypes";

export const maxDuration = 30;

export async function POST(req: Request) {
  const abortController = new AbortController();

  try {
    const body = await req.json();
    const { prompt, squiggleCode }: CreateRequestBody =
      createRequestBodySchema.parse(body);

    console.log("Inputs", prompt, squiggleCode);

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

    const { totalPrice, runTimeMs, llmRunCount, code, isValid, logSummary } =
      await runSquiggleGenerator({
        input: squiggleCode
          ? { type: "Edit", prompt, code: squiggleCode }
          : { type: "Create", prompt },
        llmConfig,
        abortSignal: req.signal,
      });

    const response: SquiggleResponse = [
      {
        code: typeof code === "string" ? code : "",
        isValid,
        totalPrice,
        runTimeMs,
        llmRunCount,
        logSummary,
      },
    ];

    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
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
