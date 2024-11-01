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
    take: 20,
  });

  const workflows = rows.map((row) => decodeDbWorkflowToClientWorkflow(row));

  return <AiDashboard initialWorkflows={workflows} />;
}
