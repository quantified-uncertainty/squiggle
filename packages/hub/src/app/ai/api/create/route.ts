import { getServerSession } from "next-auth";

import { LlmConfig } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  fixSquiggleWorkflowTemplate,
  PromptArtifact,
  SourceArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSelf, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";

import { getAiCodec, V2WorkflowData } from "../../serverUtils";
import { createRequestBodySchema, requestToInput } from "../../utils";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

async function upsertWorkflow(
  user: Awaited<ReturnType<typeof getSelf>>,
  workflow: Workflow
) {
  const codec = getAiCodec();
  const serializer = codec.makeSerializer();
  const entrypoint = serializer.serialize("workflow", workflow);
  const bundle = serializer.getBundle();

  const v2Workflow: V2WorkflowData = {
    entrypoint,
    bundle,
  };

  await prisma.aiWorkflow.upsert({
    where: {
      id: workflow.id,
    },
    update: {
      format: 2,
      workflow: v2Workflow,
    },
    create: {
      id: workflow.id,
      user: {
        connect: { id: user.id },
      },
      format: 2,
      workflow: v2Workflow,
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!isSignedIn(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await getSelf(session);

  try {
    const body = await req.json();
    const request = createRequestBodySchema.parse(body);

    if (!request.prompt && !request.squiggleCode) {
      throw new Error("Prompt or Squiggle code is required");
    }

    // Create a SquiggleWorkflow instance
    const llmConfig: LlmConfig = {
      llmId: request.model ?? "Claude-Sonnet",
      priceLimit: 0.15,
      durationLimitMinutes: 2,
      messagesInHistoryToKeep: 4,
    };

    const input = requestToInput(request);
    const openaiApiKey = process.env["OPENAI_API_KEY"];
    const anthropicApiKey = process.env["ANTHROPIC_API_KEY"];

    const squiggleWorkflow =
      input.type === "Create"
        ? createSquiggleWorkflowTemplate.instantiate({
            llmConfig,
            inputs: {
              prompt: new PromptArtifact(input.prompt),
            },
            abortSignal: req.signal,
            openaiApiKey,
            anthropicApiKey,
          })
        : fixSquiggleWorkflowTemplate.instantiate({
            llmConfig,
            inputs: {
              source: new SourceArtifact(input.source),
            },
            abortSignal: req.signal,
            openaiApiKey,
            anthropicApiKey,
          });

    // save workflow to the database on each update
    squiggleWorkflow.workflow.addEventListener("stepFinished", ({ workflow }) =>
      upsertWorkflow(user, workflow)
    );

    const stream = squiggleWorkflow.runAsStream();

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
