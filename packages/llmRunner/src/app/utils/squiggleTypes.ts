import { z } from "zod";

// Protocol for streaming workflow changes between server and client.

export const workflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
});

export type WorkflowResult = z.infer<typeof workflowResultSchema>;

const squiggleWorkflowResultSchema = workflowResultSchema.extend({
  logSummary: z.string(), // markdown
});

export type SquiggleWorkflowResult = z.infer<
  typeof squiggleWorkflowResultSchema
>;

const stepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("prompt"),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("source"),
    value: z.string(),
  }),
  z.object({
    kind: z.literal("code"),
    value: z.string(),
    ok: z.boolean(),
  }),
]);

const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
  outputs: z.record(z.string(), artifactSchema),
});

export type StepDescription = z.infer<typeof stepSchema>;

export type ArtifactDescription = z.infer<typeof artifactSchema>;

const stepAddedSchema = stepSchema.omit({ state: true, outputs: true });

const stepUpdatedSchema = stepSchema.partial().required({ id: true });

export const workflowMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("finalResult"),
    content: squiggleWorkflowResultSchema,
  }),
  z.object({
    kind: z.literal("stepAdded"),
    content: stepAddedSchema,
  }),
  z.object({
    kind: z.literal("stepUpdated"),
    content: stepUpdatedSchema,
  }),
]);

export type SquiggleWorkflowMessage = z.infer<typeof workflowMessageSchema>;

// Client-side representation of a workflow.
export type WorkflowDescription = {
  id: string;
  timestamp: Date;
  request: CreateRequestBody;
  steps: StepDescription[];
  currentStep?: string;
} & (
  | { status: "loading"; result?: undefined }
  | { status: "finished"; result: SquiggleWorkflowResult }
  | { status: "error"; result: string }
);

export const createRequestBodySchema = z.object({
  prompt: z.string().optional(),
  squiggleCode: z.string().optional(),
});

export type CreateRequestBody = z.infer<typeof createRequestBodySchema>;
