import { ClientWorkflow, clientWorkflowSchema } from "@quri/squiggle-ai";

import { prisma } from "@/prisma";
import { getUserOrRedirect } from "@/server/helpers";

import { AiDashboard } from "./AiDashboard";
import { getAiCodec, v2WorkflowDataSchema } from "./serverUtils";

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

  const workflows: ClientWorkflow[] = rows.map((row) => {
    try {
      switch (row.format) {
        case 1:
          return clientWorkflowSchema.parse(row.workflow);
        case 2: {
          const { bundle, entrypoint } = v2WorkflowDataSchema.parse(
            row.workflow
          );
          const codec = getAiCodec();
          const deserializer = codec.makeDeserializer(bundle);
          const workflow = deserializer.deserialize(entrypoint);

          return workflow.asClientWorkflow();
        }
        default:
          throw new Error(`Unknown workflow format: ${row.format}`);
      }
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
