import { getServerSession } from "next-auth";

import {
  decodeWorkflowFromReader,
  LlmConfig,
  SerializedWorkflow,
  SquiggleWorkflowInput,
} from "@quri/squiggle-ai";
import { SquiggleWorkflow } from "@quri/squiggle-ai/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSelf, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";

import {
  bodyToLineReader,
  createRequestBodySchema,
  requestToInput,
} from "../../utils";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!isSignedIn(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await getSelf(session);

  let workflow: SerializedWorkflow;

  const streamToDatabase = (
    stream: ReadableStream<string>,
    input: SquiggleWorkflowInput
  ) => {
    decodeWorkflowFromReader({
      reader: bodyToLineReader(stream) as ReadableStreamDefaultReader,
      input,
      addWorkflow: async (newWorkflow) => {
        await prisma.aiWorkflow.create({
          data: {
            id: newWorkflow.id,
            user: {
              connect: {
                id: user.id,
              },
            },
            workflow: newWorkflow,
          },
        });
        workflow = newWorkflow;
      },
      setWorkflow: async (update) => {
        if (!workflow) {
          throw new Error(
            "Internal error: setWorkflow called before addWorkflow"
          );
        }
        workflow = update(workflow);
        await prisma.aiWorkflow.update({
          where: {
            id: workflow.id,
          },
          data: { workflow },
        });
      },
    });
  };

  try {
    const body = await req.json();
    const request = createRequestBodySchema.parse(body);

    if (!request.prompt && !request.squiggleCode) {
      throw new Error("Prompt or Squiggle code is required");
    }

    // Create a SquiggleGenerator instance
    const llmConfig: LlmConfig = {
      llmId: request.model ?? "Claude-Sonnet",
      priceLimit: 0.3,
      durationLimitMinutes: 4,
      messagesInHistoryToKeep: 4,
    };

    const input = requestToInput(request);
    const stream = new SquiggleWorkflow({
      llmConfig,
      input,
      abortSignal: req.signal,
      openaiApiKey: process.env["OPENAI_API_KEY"],
      anthropicApiKey: process.env["ANTHROPIC_API_KEY"],
    }).runAsStream();

    const [responseStream, dbStream] = stream.tee();

    streamToDatabase(dbStream as ReadableStream<string>, input);

    return new Response(responseStream as ReadableStream, {
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
