import "server-only";

import { AiWorkflow as PrismaAiWorkflow } from "@prisma/client";

import { ClientWorkflow } from "@quri/squiggle-ai";

import { decodeV1_0JsonToClientWorkflow } from "@/server/ai/v1_0";
import { decodeV2_0JsonToClientWorkflow } from "@/server/ai/v2_0";

export function decodeDbWorkflowToClientWorkflow(
  row: PrismaAiWorkflow
): ClientWorkflow {
  try {
    switch (row.format) {
      case "V1_0":
        return decodeV1_0JsonToClientWorkflow(row.workflow);
      case "V2_0":
        return decodeV2_0JsonToClientWorkflow(row.workflow);
      default:
        throw new Error(
          `Unknown workflow format: ${row.format satisfies never}`
        );
    }
  } catch (e) {
    return {
      id: row.id,
      timestamp: row.createdAt.getTime(),
      status: "error",
      inputs: {},
      steps: [],
      result: `Invalid workflow format in the database: ${e}`,
    } satisfies ClientWorkflow;
  }
}
