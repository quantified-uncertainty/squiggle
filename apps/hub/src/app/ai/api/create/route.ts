import { LlmConfig } from "@quri/squiggle-ai";
import {
  createSquiggleWorkflowTemplate,
  fixSquiggleWorkflowTemplate,
  PromptArtifact,
  SourceArtifact,
  Workflow,
} from "@quri/squiggle-ai/server";

import { workflowToV2_0Json } from "@/ai/data/v2_0";
import { auth } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { getSelf, isSignedIn } from "@/users/auth";

import { AiRequestBody, aiRequestBodySchema } from "../../utils";

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#maxduration
export const maxDuration = 300;

async function updateDbWorkflow(
  workflow: Workflow<any>,
  opts: { final?: boolean } = {}
) {
  const v2Workflow = workflowToV2_0Json(workflow);

  console.log(
    `Update workflow ${workflow.id}: ${workflow.getStepCount()} steps, final: ${opts.final ?? false}`
  );
  const startTime = Date.now();

  // We were doing both create and update with `upsert`, but Claude recommended to separate them for performance.
  await prisma.aiWorkflow.update({
    select: {
      id: true,
    },
    where: {
      id: workflow.id,
    },
    data: {
      format: "V2_0",
      workflow: v2Workflow,
      ...(opts.final && { markdown: workflow.getFinalResult().logSummary }),
    },
  });
  console.log(
    `Updated workflow ${workflow.id}: ${workflow.getStepCount()} steps, final: ${opts.final ?? false}, ${Date.now() - startTime}ms`
  );
}

function saveWorkflowToDbOnUpdates(workflow: Workflow<any>) {
  // Save workflow to the database on each update.
  workflow.addEventListener("stepAdded", () => {
    updateDbWorkflow(workflow);
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
    updateDbWorkflow(workflow, { final: true });
  });
}

async function createDbWorkflow(
  workflow: Workflow<any>,
  user: Awaited<ReturnType<typeof getSelf>>
) {
  const v2Workflow = workflowToV2_0Json(workflow);

  console.log(
    `Create DB workflow ${workflow.id}: ${workflow.getStepCount()} steps`
  );
  const startTime = Date.now();

  // try/catch is not necessary, but Next.js is logging some weird errors that I tried to debug here.
  // See this thread: https://www.reddit.com/r/nextjs/comments/1gkxdqe/typeerror_the_payload_argument_must_be_of_type/
  // "Created DB workflow" is logged, though, so it's _probably_ working correctly.
  try {
    await prisma.aiWorkflow.create({
      data: {
        id: workflow.id,
        user: {
          connect: { id: user.id },
        },
        format: "V2_0",
        workflow: v2Workflow,
      },
    });
    console.log(
      `Created DB workflow ${workflow.id}: ${workflow.getStepCount()} steps, ${Date.now() - startTime}ms`
    );
  } catch (error) {
    console.error(`Error creating DB workflow ${workflow.id}: ${error}`);
  }
}

function aiRequestToWorkflow(request: AiRequestBody) {
  // Create a SquiggleWorkflow instance
  const llmConfig: LlmConfig = {
    llmId: request.model ?? "Claude-Sonnet",
    priceLimit: 0.8,
    durationLimitMinutes: 6,
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

    await createDbWorkflow(workflow, user);

    saveWorkflowToDbOnUpdates(workflow);

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
