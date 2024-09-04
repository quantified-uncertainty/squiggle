import { z } from "zod";

export const squiggleSchema = z.object({
  code: z.string().describe("Squiggle code snippet"),
  isValid: z.boolean(),
  totalPrice: z.number(),
  runTimeMs: z.number(),
  llmRunCount: z.number(),
  logSummary: z.string(),
});

export const squiggleResponseSchema = z.array(squiggleSchema);

export type SquiggleResponse = z.infer<typeof squiggleResponseSchema>;

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
