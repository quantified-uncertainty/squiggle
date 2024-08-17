import { Logger } from "../../../llmScript/logger";
import { runSquiggleGenerator } from "../../../llmScript/main";
import { AVAILABLE_MODELS } from "../../utils/llms";

export const maxDuration = 30;
export async function POST(req: Request) {
  const abortController = new AbortController();

  try {
    const body = await req.json();
    const {
      prompt,
      model: backendTitle,
      previousPrompt,
      previousCode,
      previousResponse,
    } = body;

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const selectedModel = AVAILABLE_MODELS.find(
      (m) => m.backendTitle === backendTitle
    );
    if (!selectedModel) {
      throw new Error("Invalid model selected");
    }

    // Run the Squiggle generator 3 times in parallel
    const squigglePromises = [
      runSquiggleGenerator(prompt, new Logger()),
      runSquiggleGenerator(prompt, new Logger()),
      runSquiggleGenerator(prompt, new Logger()),
    ];

    const squiggleResults = await Promise.all(squigglePromises);

    // Log all responses
    squiggleResults.forEach((result, index) => {
      console.log(`Response ${index + 1}:`, result);
    });

    // Prepare the responses including all results
    const responses = squiggleResults.map((result) => ({
      code: result.code,
      isValid: result.isValid,
      trackingInfo: result.trackingInfo,
      conversationHistory: result.conversationHistory,
    }));

    // Handle client disconnection
    req.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    // Return the responses as a stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(JSON.stringify(responses));
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
