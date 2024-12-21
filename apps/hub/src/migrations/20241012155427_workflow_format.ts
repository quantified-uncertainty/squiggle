import { prisma } from "@/lib/server/prisma";

export async function migrate() {
  const v1Workflows = await prisma.aiWorkflow.findMany({
    where: {
      format: "V1_0",
      workflow: {
        path: ["status"],
        equals: "finished",
      },
    },
  });

  for (const workflow of v1Workflows) {
    const markdown =
      (workflow.workflow as any)?.["result"]?.["logSummary"] ?? "";
    await prisma.aiWorkflow.update({
      where: { id: workflow.id },
      data: { markdown: String(markdown) },
    });
  }
}

migrate();
