import { LlmConfig } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  fixSquiggleWorkflowTemplate,
  PromptArtifact,
  SourceArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";

import { auth } from "@/auth";
import { getSelf, isSignedIn } from "@/graphql/helpers/userHelpers";
import { prisma } from "@/prisma";
import { getAiCodec } from "@/server/ai/utils";
import { V2WorkflowData } from "@/server/ai/v2_0";

import { AiRequestBody, aiRequestBodySchema } from "../../utils";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

async function upsertWorkflow(
  user: Awaited<ReturnType<typeof getSelf>>,
  workflow: Workflow<any>
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
      format: "V2_0",
      workflow: v2Workflow,
    },
    create: {
      id: workflow.id,
      user: {
        connect: { id: user.id },
      },
      format: "V2_0",
      workflow: v2Workflow,
    },
  });
}

async function updateWorkflowLog(workflow: Workflow<any>) {
  const result = workflow.getFinalResult();
  await prisma.aiWorkflow.update({
    where: { id: workflow.id },
    data: { markdown: result.logSummary },
  });
}

function aiRequestToWorkflow(request: AiRequestBody) {
  // Create a SquiggleWorkflow instance
  const llmConfig: LlmConfig = {
    llmId: request.model ?? "Claude-Sonnet",
    priceLimit: 0.3,
    durationLimitMinutes: 2,
    messagesInHistoryToKeep: 4,
    numericSteps: request.numericSteps,
    styleGuideSteps: request.styleGuideSteps,
  };

  const openaiApiKey = process.env["OPENAI_API_KEY"];
  const anthropicApiKey =
    request.anthropicApiKey || process.env["ANTHROPIC_API_KEY"];

  const workflow =
    request.kind === "create"
      ? createSquiggleWorkflowTemplate.instantiate({
          llmConfig,
          inputs: {
            prompt: new PromptArtifact(request.prompt),
          },
          // abortSignal: req.signal,
          openaiApiKey,
          anthropicApiKey,
        })
      : fixSquiggleWorkflowTemplate.instantiate({
          llmConfig,
          inputs: {
            source: new SourceArtifact(request.squiggleCode),
          },
          // abortSignal: req.signal,
          openaiApiKey,
          anthropicApiKey,
        });

  return workflow;
}

function saveWorkflowToDbOnUpdates(
  workflow: Workflow<any>,
  user: Awaited<ReturnType<typeof getSelf>>
) {
  // Save workflow to the database on each update.
  workflow.addEventListener("stepAdded", () => {
    upsertWorkflow(user, workflow);
  });

  /*
   * We save the markdown log after all steps are finished. This means that if
   * the workflow fails or this route dies, there'd be no log summary. Should
   * we save the log summary after each step? It'd be more expensive but more
   * robust.
   * (this important only in case we decide to roll back our fully
   * deserializable workflows; if deserialization works well then this doesn't
   * matter, the log is redundant)
   */
  workflow.addEventListener("allStepsFinished", () => {
    updateWorkflowLog(workflow);
  });
}

export async function POST(req: Request) {
  const session = await auth();

  if (!isSignedIn(session)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await getSelf(session);

  try {
    const body = await req.json();
    const request = aiRequestBodySchema.parse(body);

    const workflow = aiRequestToWorkflow(request);

    saveWorkflowToDbOnUpdates(workflow, user);

    const stream = workflow.runAsStream();

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
