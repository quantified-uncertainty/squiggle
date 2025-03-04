import { Prisma } from "@quri/hub-db";
import { ClientWorkflow } from "@quri/squiggle-ai";

import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { checkRootUser, getSessionUserOrRedirect } from "@/users/auth";

import { decodeDbWorkflowToClientWorkflow } from "./storage";

export type AiWorkflow = {
  workflow: ClientWorkflow;
  author: {
    username: string;
  };
};

export async function loadWorkflows(
  params: {
    allUsers?: boolean;
    cursor?: string;
    limit?: number;
  } = {}
): Promise<Paginated<AiWorkflow>> {
  const sessionUser = await getSessionUserOrRedirect();

  const limit = params.limit ?? 20;

  const where: Prisma.AiWorkflowWhereInput = {};
  if (params.allUsers) {
    console.log("loading all workflows");
    await checkRootUser();
  } else {
    where.user = { email: sessionUser.email };
  }

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
    cursor: params.cursor ? { id: params.cursor } : undefined,
    where,
    include: {
      user: {
        select: {
          asOwner: {
            select: {
              slug: true,
            },
          },
        },
      },
    },
    take: limit + 1,
  });

  // TODO - it would be good to preserve author information in the client, but this would require a new type (ClientWorkflowWithAuthor?)
  const workflows = rows.map((row) => ({
    workflow: decodeDbWorkflowToClientWorkflow(row),
    author: { username: row.user.asOwner?.slug ?? "[unknown]" },
  }));

  const nextCursor = workflows[workflows.length - 1]?.workflow.id;

  async function loadMore(limit: number) {
    "use server";
    return loadWorkflows({ ...params, cursor: nextCursor, limit });
  }

  return {
    items: workflows.slice(0, limit),
    loadMore: workflows.length > limit ? loadMore : undefined,
  };
}
