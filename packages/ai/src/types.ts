import { z } from "zod";

// This could be defined in SquiggleWorkflow.ts, but it would cause a dependency on server-only modules.
export const squiggleWorkflowInputSchema = z.discriminatedUnion("type", [
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

// Protocol for streaming workflow changes between server and client.

// SerializedArtifact type

const commonArtifactFields = {
  id: z.string(),
  createdBy: z.string().optional(),
};

const artifactSchema = z.discriminatedUnion("kind", [
  z.object({
    ...commonArtifactFields,
    kind: z.literal("prompt"),
    value: z.string(),
  }),
  z.object({
    ...commonArtifactFields,
    kind: z.literal("source"),
    value: z.string(),
  }),
  z.object({
    ...commonArtifactFields,
    kind: z.literal("code"),
    value: z.string(),
    ok: z.boolean(),
  }),
]);

export type SerializedArtifact = z.infer<typeof artifactSchema>;

// SerializedStep type

const stepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export type SerializedMessage = z.infer<typeof messageSchema>;

const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
  outputs: z.record(z.string(), artifactSchema),
  messages: z.array(messageSchema),
});

export type SerializedStep = z.infer<typeof stepSchema>;

// Messages that incrementally update the SerializedWorkflow.
// They are using for streaming updates from the server to the client.
// They are similar to Workflow events, but not exactly the same. They must be JSON-serializable.
// See `addStreamingListeners` in workflows/streaming.ts for how they are used.

const workflowStartedSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
});

const stepAddedSchema = stepSchema.omit({
  state: true,
  outputs: true,
  messages: true,
});

const stepUpdatedSchema = stepSchema.partial().required({
  id: true,
  messages: true,
  outputs: true,
});

// WorkflowResult type

export const workflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

export type WorkflowResult = z.infer<typeof workflowResultSchema>;

export const workflowMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("workflowStarted"),
    content: workflowStartedSchema,
  }),
  z.object({
    kind: z.literal("finalResult"),
    content: workflowResultSchema,
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

export type WorkflowMessage = z.infer<typeof workflowMessageSchema>;

// Client-side representation of a workflow

const commonWorkflowFields = {
  id: z.string(),
  timestamp: z.number(), // milliseconds since epoch
  input: squiggleWorkflowInputSchema, // FIXME - SquiggleWorkflow-specific
  steps: z.array(stepSchema),
  currentStep: z.string().optional(),
};

export const serializedWorkflowSchema = z.discriminatedUnion("status", [
  z.object({
    ...commonWorkflowFields,
    status: z.literal("loading"),
    result: z.undefined(),
  }),
  z.object({
    ...commonWorkflowFields,
    status: z.literal("finished"),
    result: workflowResultSchema,
  }),
  z.object({
    ...commonWorkflowFields,
    status: z.literal("error"),
    result: z.string(),
  }),
]);

export type SerializedWorkflow = z.infer<typeof serializedWorkflowSchema>;
