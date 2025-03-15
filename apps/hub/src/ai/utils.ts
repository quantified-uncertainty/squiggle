import "server-only";

import { User } from "@quri/hub-db";
import { Workflow } from "@quri/squiggle-ai/server";

import { prisma } from "@/lib/server/prisma";

import { workflowToV2_0Json } from "./data/v2_0";

export async function saveWorkflowToDb(
  workflow: Workflow<any>,
  user: User,
  opts: { final?: boolean } = {}
) {
  const v2Workflow = workflowToV2_0Json(workflow);

  console.log(
    `Create DB workflow ${workflow.id}: ${workflow.getStepCount()} steps`
  );
  const startTime = Date.now();

  const dbWorkflow = await prisma.aiWorkflow.create({
    data: {
      id: workflow.id,
      user: {
        connect: { id: user.id },
      },
      format: "V2_0",
      workflow: v2Workflow,
      ...(opts.final && {
        markdown: workflow.getFinalResult().logSummary,
        metrics: workflow.getLlmMetrics(),
      }),
    },
  });
  console.log(
    `Created DB workflow ${workflow.id}: ${workflow.getStepCount()} steps, ${Date.now() - startTime}ms`
  );

  return dbWorkflow;
}

export async function updateDbWorkflow(
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
      ...(opts.final && {
        markdown: workflow.getFinalResult().logSummary,
        metrics: workflow.getLlmMetrics(),
      }),
    },
  });
  console.log(
    `Updated workflow ${workflow.id}: ${workflow.getStepCount()} steps, final: ${opts.final ?? false}, ${Date.now() - startTime}ms`
  );
}
