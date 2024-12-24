import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/server/prisma";
import { checkRootUser, getSessionUserOrRedirect } from "@/users/auth";

import { decodeDbWorkflowToClientWorkflow } from "./storage";

export async function loadWorkflows({
  limit = 20,
  allUsers = false,
}: {
  limit?: number;
  allUsers?: boolean;
} = {}) {
  const sessionUser = await getSessionUserOrRedirect();

  const where: Prisma.AiWorkflowWhereInput = {};
  if (allUsers) {
    await checkRootUser();
  } else {
    where.user = { email: sessionUser.email };
  }

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
    where,
    take: limit + 1,
  });

  const workflows = rows.map((row) => decodeDbWorkflowToClientWorkflow(row));

  return {
    workflows: limit ? workflows.slice(0, limit) : workflows,
    hasMore: limit ? workflows.length > limit : false,
  };
}
