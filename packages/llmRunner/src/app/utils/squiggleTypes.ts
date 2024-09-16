import { z } from "zod";

import { LLMName, MODEL_CONFIGS } from "../../llmRunner/modelConfigs";

// Protocol for streaming workflow changes between server and client.

// ArtifactDescription type

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

export type ArtifactDescription = z.infer<typeof artifactSchema>;

// StepDescription type

const stepStateSchema = z.enum(["PENDING", "DONE", "FAILED"]);

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export type MessageDescription = z.infer<typeof messageSchema>;

const stepSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: stepStateSchema,
  inputs: z.record(z.string(), artifactSchema),
  outputs: z.record(z.string(), artifactSchema),
  messages: z.array(messageSchema),
});

export type StepDescription = z.infer<typeof stepSchema>;

// SquiggleWorkflowResult type

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

// Messages that incrementally update the WorkflowDescription

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

// Client-side representation of a workflow

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

// /api/create request shape

// Via https://github.com/microsoft/TypeScript/issues/13298#issuecomment-885980381
type UnionToIntersection<U> = (
  U extends never ? never : (arg: U) => never
) extends (arg: infer I) => void
  ? I
  : never;

type UnionToTuple<T> =
  UnionToIntersection<T extends never ? never : (t: T) => T> extends (
    _: never
  ) => infer W
    ? [...UnionToTuple<Exclude<T, W>>, W]
    : [];

type ModelKeys = UnionToTuple<LLMName>;

export const createRequestBodySchema = z.object({
  prompt: z.string().optional(),
  squiggleCode: z.string().optional(),
  model: z.enum(Object.keys(MODEL_CONFIGS) as ModelKeys).optional(),
});

export type CreateRequestBody = z.infer<typeof createRequestBodySchema>;
