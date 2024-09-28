import { ClientWorkflow, clientWorkflowSchema } from "@quri/squiggle-ai";

import { prisma } from "@/prisma";
import { getUserOrRedirect } from "@/server/helpers";

import { AiDashboard } from "./AiDashboard";

export default async function AiPage() {
  const user = await getUserOrRedirect();

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: {
      createdAt: "desc",
    },
    where: {
      user: { email: user.email },
    },
  });

  const workflows = rows.map((row) => {
    try {
      return clientWorkflowSchema.parse(row.workflow);
    } catch (e) {
      return {
        id: row.id,
        timestamp: row.createdAt.getTime(),
        status: "error",
        input: {
          type: "Create",
          prompt: "[unknown workflow]",
        },
        steps: [],
        result: "Invalid workflow format in the database",
      } satisfies ClientWorkflow;
    }
  });

  return <AiDashboard initialWorkflows={workflows} />;
}
