import { runSquiggleGenerator } from "../../../llmRunner/main";
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

    const playgroundCount = Math.max(
      1,
      Math.min(5, Number(numPlaygrounds) || 1)
    );

    //TODO: Add squiggleCode to the prompt, if it exists
    // Run the Squiggle generator the specified number of times in parallel
    const squigglePromises = Array(playgroundCount)
      .fill(null)
      .map(() => runSquiggleGenerator(prompt));

    const squiggleResults = await Promise.all(squigglePromises);

    // Log all responses
    squiggleResults.forEach((result, index) => {
      console.log(`Response ${index + 1}:`, result);
    });

    // Prepare the responses including all results
    const responses = squiggleResults.map((result) => ({
      code: result.code,
      isValid: result.isValid,
      totalPrice: result.totalPrice,
      runTimeMs: result.runTimeMs,
      llmRunCount: result.llmRunCount,
    }));

    // Validate the response using the schema
    const validatedResponses = squiggleResponseSchema.parse(responses);

    // Handle client disconnection
    req.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    // Return the responses as a stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(JSON.stringify(validatedResponses));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error === "AbortError") {
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
