import { ClientWorkflow } from "@quri/squiggle-ai";

import { prisma } from "@/prisma";
import { getUserOrRedirect } from "@/server/helpers";

import { decodeDbWorkflowToClientWorkflow } from "../../server/ai/storage";
import { AiDashboard } from "./AiDashboard";

export default async function AiPage() {
  const user = await getUserOrRedirect();

  const rows = await prisma.aiWorkflow.findMany({
    orderBy: { createdAt: "desc" },
    where: {
      user: { email: user.email },
    },
  });

  const workflows: ClientWorkflow[] = rows.map((row) =>
    decodeDbWorkflowToClientWorkflow(row)
  );

  return <AiDashboard initialWorkflows={workflows} />;
}
