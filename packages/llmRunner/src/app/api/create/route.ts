import { Artifact } from "../../../llmRunner/Artifact";
import { runSquiggleWorkflow } from "../../../llmRunner/squiggleWorkflow";
import { LlmConfig } from "../../../llmRunner/Workflow";
import {
  ArtifactDescription,
  CreateRequestBody,
  createRequestBodySchema,
  SquiggleWorkflowMessage,
} from "../../utils/squiggleTypes";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

function artifactToDescription(value: Artifact): ArtifactDescription {
  const commonArtifactFields = {
    id: value.id,
    createdBy: value.createdBy?.id,
  };
  switch (value.kind) {
    case "source":
      return {
        ...commonArtifactFields,
        kind: "source",
        value: value.value,
      };
    case "code":
      return {
        ...commonArtifactFields,
        kind: "code",
        value: value.value.source,
        ok: value.value.type === "success",
      };
    case "prompt":
      return {
        ...commonArtifactFields,
        kind: "prompt",
        value: value.value,
      };
    default:
      throw new Error(`Unknown artifact ${value satisfies never}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, squiggleCode }: CreateRequestBody =
      createRequestBodySchema.parse(body);

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

        await runSquiggleWorkflow({
          input: squiggleCode
            ? { type: "Edit", source: squiggleCode }
            : { type: "Create", prompt: prompt ?? "" },
          llmConfig,
          abortSignal: req.signal,
          openaiApiKey: process.env["OPENROUTER_API_KEY"],
          anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
          handlers: {
            stepAdded: (event) => {
              send({
                kind: "stepAdded",
                content: {
                  id: event.data.step.id,
                  name: event.data.step.template.name ?? "unknown",
                  inputs: Object.fromEntries(
                    Object.entries(event.data.step.getInputs()).map(
                      ([key, value]) => [key, artifactToDescription(value)]
                    )
                  ),
                },
              });
            },
            stepFinished: (event) => {
              send({
                kind: "stepUpdated",
                content: {
                  id: event.data.step.id,
                  state: event.data.step.getState().kind,
                  outputs: Object.fromEntries(
                    Object.entries(event.data.step.getOutputs())
                      .filter(
                        (
                          pair
                        ): pair is [string, NonNullable<(typeof pair)[1]>] =>
                          pair[1] !== undefined
                      )
                      .map(([key, value]) => [
                        key,
                        artifactToDescription(value),
                      ])
                  ),
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
