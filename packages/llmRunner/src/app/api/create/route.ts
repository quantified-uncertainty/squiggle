import {
  LlmConfig,
  runSquiggleGenerator,
} from "../../../llmRunner/squiggleGenerator";
import {
  CreateRequestBody,
  createRequestBodySchema,
  SquiggleWorkflowMessage,
} from "../../utils/squiggleTypes";

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

    const stream = new ReadableStream({
      async pull(controller) {
        const send = (message: SquiggleWorkflowMessage) => {
          controller.enqueue(JSON.stringify(message) + "\n");
        };

        await runSquiggleGenerator({
          input: squiggleCode
            ? { type: "Edit", code: squiggleCode }
            : { type: "Create", prompt: prompt ?? "" },
          llmConfig,
          abortSignal: req.signal,
          openaiApiKey: process.env["OPENROUTER_API_KEY"],
          anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
          handlers: {
            startStep: (event) => {
              send({
                kind: "startStep",
                content: {
                  step: event.data.step.template.name ?? "unknown",
                },
              });
            },
            finishSquiggleWorkflow: (event) => {
              send({
                kind: "finalResult",
                content: event.data.result,
              });
            },
          },
        });
        controller.close();
      },
    });

    return new Response(stream, {
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
