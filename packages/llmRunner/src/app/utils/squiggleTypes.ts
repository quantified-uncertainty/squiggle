import { z } from "zod";

// Protocol for streaming workflow changes between server and client.
const squiggleWorkflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

const stepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("prompt"),
    value: z.string(),
  }),
  z.object({
    // codeState is simplified to code in the current protocol
    kind: z.literal("code"),
    value: z.string(),
  }),
]);

export type ArtifactDescription = z.infer<typeof artifactSchema>;

const stepAddedSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
});

const stepUpdatedSchema = z.object({
  id: z.string(),
  state: stepStateSchema,
});

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

export type SquiggleWorkflowResult = z.infer<
  typeof squiggleWorkflowResultSchema
>;

export type SquiggleWorkflowMessage = z.infer<typeof workflowMessageSchema>;

export type StepDescription = {
  id: string;
  name: string;
  state: z.infer<typeof stepStateSchema>;
};

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
