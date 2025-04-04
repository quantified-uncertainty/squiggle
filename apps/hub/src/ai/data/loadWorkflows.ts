import { Prisma } from "@quri/hub-db";
import { ClientWorkflow } from "@quri/squiggle-ai";

import { findPaginated, makePaginated } from "@/lib/server/dataHelpers";
import { prisma } from "@/lib/server/prisma";
import { Paginated } from "@/lib/types";
import { checkRootUser, getSessionOrRedirect } from "@/users/auth";

import { decodeDbWorkflowToClientWorkflow } from "./storage";

export type AiWorkflowDTO = {
  workflow: ClientWorkflow;
  author: {
    username: string;
  };
};

export async function loadWorkflows({
  limit = 20,
  cursor,
  ...params
}: {
  allUsers?: boolean;
  cursor?: string;
  limit?: number;
} = {}): Promise<Paginated<AiWorkflowDTO>> {
  const session = await getSessionOrRedirect();

  const where: Prisma.AiWorkflowWhereInput = {};
  if (params.allUsers) {
    console.log("loading all workflows");
    await checkRootUser();
  } else {
    where.user = { email: session.user.email };
  }

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
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
    ...findPaginated(cursor, limit),
  });

  const workflows = rows.map(
    (row): AiWorkflowDTO => ({
      workflow: decodeDbWorkflowToClientWorkflow(row),
      author: { username: row.user.asOwner?.slug ?? "[unknown]" },
    })
  );

  const nextCursor = workflows[workflows.length - 1]?.workflow.id;
  async function loadMore(limit: number) {
    "use server";
    return loadWorkflows({ ...params, cursor: nextCursor, limit });
  }

  return makePaginated(workflows, limit, loadMore);
}
