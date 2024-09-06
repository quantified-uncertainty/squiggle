import { z } from "zod";

const squiggleWorkflowResultSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(), // markdown
});

const currentStepSchema = z.object({
  step: z.string(),
});

export const workflowMessageSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("finalResult"),
    content: squiggleWorkflowResultSchema,
  }),
  z.object({
    kind: z.literal("currentStep"),
    content: currentStepSchema,
  }),
]);

export type SquiggleWorkflowResult = z.infer<
  typeof squiggleWorkflowResultSchema
>;

export type SquiggleWorkflowMessage = z.infer<typeof workflowMessageSchema>;

export type Action = {
  id: string;
  prompt: string;
  result?: string;
  code?: string;
  logSummary?: string;
  status: "loading" | "success" | "error";
  timestamp: Date;
};

export const createRequestBodySchema = z.object({
  prompt: z.string().optional(),
  squiggleCode: z.string().optional(),
});

export type CreateRequestBody = z.infer<typeof createRequestBodySchema>;
