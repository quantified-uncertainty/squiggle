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

const stepNameSchema = z.object({
  step: z.string(),
});

export const workflowMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("finalResult"),
    content: squiggleWorkflowResultSchema,
  }),
  z.object({
    kind: z.literal("startStep"),
    content: stepNameSchema,
  }),
]);

export type SquiggleWorkflowResult = z.infer<
  typeof squiggleWorkflowResultSchema
>;

export type SquiggleWorkflowMessage = z.infer<typeof workflowMessageSchema>;

// Client-side representation of a workflow.
export type WorkflowDescription = {
  id: string;
  timestamp: Date;
  request: CreateRequestBody;
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
