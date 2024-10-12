import "server-only";

import { Prisma } from "@prisma/client";
import { z } from "zod";

import { ClientWorkflow } from "@quri/squiggle-ai";

// Snapshot of ClientWorkflow schemas as it was at the time we upgraded to V2
// These don't include inputs, which were added in V2.

export const v1InputSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("Create"),
    prompt: z.string(),
  }),
  z.object({
    type: z.literal("Edit"),
    source: z.string(),
    prompt: z.string().optional(),
  }),
]);

const v1CommonArtifactFields = {
  id: z.string(),
  createdBy: z.string().optional(),
};

const v1ArtifactSchema = z.discriminatedUnion("kind", [
  z.object({
    ...v1CommonArtifactFields,
    kind: z.literal("prompt"),
    value: z.string(),
  }),
  z.object({
    ...v1CommonArtifactFields,
    kind: z.literal("source"),
    value: z.string(),
  }),
  z.object({
    ...v1CommonArtifactFields,
    kind: z.literal("code"),
    value: z.string(),
    ok: z.boolean(),
  }),
]);

const v1StepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const v1MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const v1StepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: v1StepStateSchema,
  inputs: z.record(z.string(), v1ArtifactSchema),
  outputs: z.record(z.string(), v1ArtifactSchema),
  messages: z.array(v1MessageSchema),
});

const commonV1WorkflowFields = {
  id: z.string(),
  timestamp: z.number(), // milliseconds since epoch
  input: v1InputSchema,
  steps: z.array(v1StepSchema),
  currentStep: z.string().optional(),
};

const v1WorkflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

export const v1WorkflowSchema = z.discriminatedUnion("status", [
  z.object({
    ...commonV1WorkflowFields,
    status: z.literal("loading"),
    result: z.undefined(),
  }),
  z.object({
    ...commonV1WorkflowFields,
    status: z.literal("finished"),
    result: v1WorkflowResultSchema,
  }),
  z.object({
    ...commonV1WorkflowFields,
    status: z.literal("error"),
    result: z.string(),
  }),
]);

export function decodeV1_0JsonToClientWorkflow(
  json: Prisma.JsonValue
): ClientWorkflow {
  const v1Workflow = v1WorkflowSchema.parse(json);

  return {
    ...v1Workflow,
    inputs:
      v1Workflow.input.type === "Create"
        ? {
            prompt: {
              value: v1Workflow.input.prompt,
              kind: "prompt",
              id: `${v1Workflow.id}-prompt`,
            },
          }
        : {
            source: {
              value: v1Workflow.input.source,
              kind: "source",
              id: `${v1Workflow.id}-source`,
            },
          },
  };
}
