import "server-only";

import { AiWorkflow as PrismaAiWorkflow } from "@quri/hub-db";
import { ClientWorkflow } from "@quri/squiggle-ai";

import { decodeV1_0JsonToClientWorkflow } from "@/ai/data/v1_0";
import { decodeV2_0JsonToClientWorkflow } from "@/ai/data/v2_0";

export function decodeDbWorkflowToClientWorkflow(
  row: PrismaAiWorkflow
): ClientWorkflow {
  try {
    switch (row.format) {
      case "V1_0":
        return decodeV1_0JsonToClientWorkflow(row.workflow);
      case "V2_0": {
        const clientWorkflow = decodeV2_0JsonToClientWorkflow(row.workflow);
        // serialized workflow doesn't include full logs, but we store them in the database
        if (clientWorkflow.status === "finished") {
          clientWorkflow.result.logSummary = row.markdown;
        }
        return clientWorkflow;
      }
      default:
        throw new Error(
          `Unknown workflow format: ${row.format satisfies never}`
        );
    }
  } catch (e) {
    return {
      id: row.id,
      timestamp: row.createdAt.getTime(),
      status: "finished",
      inputs: {},
      steps: [],
      result: {
        code: "",
        isValid: false,
        totalPrice: 0,
        runTimeMs: 0,
        llmRunCount: 0,
        logSummary: "",
        error: `Invalid workflow format in the database: ${e}`,
      },
    } satisfies ClientWorkflow;
  }
}
