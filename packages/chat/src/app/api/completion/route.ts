import { z } from "zod";

import { runSquiggleGenerator } from "../../../llmScript/main"; // Import the new function
import { AVAILABLE_MODELS } from "../../utils/llms"; // Adjust the import path as needed

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const squiggleSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
});

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
      throw new Error("Invalid model selected:");
    }

    // Run the Squiggle generator
    const squiggleResult = await runSquiggleGenerator(prompt);

    // Prepare the response
    const response = {
      code: squiggleResult.code,
      isValid: squiggleResult.isValid,
      trackingInfo: squiggleResult.trackingInfo,
      conversationHistory: squiggleResult.conversationHistory,
    };

    // Handle client disconnection
    req.signal.addEventListener("abort", () => {
      abortController.abort();
    });

    // Return the response as a stream
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(JSON.stringify(response));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error === "AbortError") {
      return new Response("Generation stopped", { status: 499 }); // 499 is "Client Closed Request"
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
