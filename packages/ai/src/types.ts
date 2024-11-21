import { z } from "zod";

// Protocol for streaming workflow changes between server and client.

// ClientArtifact type

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

export type ClientArtifact = z.infer<typeof artifactSchema>;

// ClientStep type

export const stepStateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("PENDING"),
  }),
  z.object({
    kind: z.literal("DONE"),
    outputs: z.record(z.string(), artifactSchema),
  }),
  z.object({
    kind: z.literal("FAILED"),
    message: z.string(),
    errorType: z.enum(["CRITICAL", "MINOR"]),
  }),
]);

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export type ClientMessage = z.infer<typeof messageSchema>;

const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
  messages: z.array(messageSchema),
});

export type ClientStep = z.infer<typeof stepSchema>;

// Messages that incrementally update the ClientWorkflow.
// They are using for streaming updates from the server to the client.
// They are similar to Workflow events, but not exactly the same. They must be JSON-serializable.
// See `addStreamingListeners` in workflows/streaming.ts for how they are used.

const workflowStartedSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  inputs: z.record(z.string(), artifactSchema),
});

const stepAddedSchema = stepSchema.omit({
  state: true,
  messages: true,
});

const stepUpdatedSchema = stepSchema.partial().required({
  id: true,
  messages: true,
});

// WorkflowResult type

export const clientWorkflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

export type ClientWorkflowResult = z.infer<typeof clientWorkflowResultSchema>;

export const streamingMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("workflowStarted"),
    content: workflowStartedSchema,
  }),
  z.object({
    kind: z.literal("finalResult"),
    content: clientWorkflowResultSchema,
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

export type StreamingMessage = z.infer<typeof streamingMessageSchema>;

// Client-side representation of a workflow

const commonClientWorkflowFields = {
  id: z.string(),
  timestamp: z.number(), // milliseconds since epoch
  inputs: z.record(z.string(), artifactSchema),
  steps: z.array(stepSchema),
};

export const clientWorkflowSchema = z.discriminatedUnion("status", [
  z.object({
    ...commonClientWorkflowFields,
    status: z.literal("loading"),
    result: z.undefined(),
  }),
  z.object({
    ...commonClientWorkflowFields,
    status: z.literal("finished"),
    result: clientWorkflowResultSchema,
  }),
  z.object({
    ...commonClientWorkflowFields,
    status: z.literal("error"),
    result: z.string(),
  }),
]);

export type ClientWorkflow = z.infer<typeof clientWorkflowSchema>;
