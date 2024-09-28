import "server-only";

import { z } from "zod";

import { makeAiCodec } from "@quri/squiggle-ai/server";

export function getAiCodec() {
  const openaiApiKey = process.env["OPENROUTER_API_KEY"];
  const anthropicApiKey = process.env["ANTHROPIC_API_KEY"];
  return makeAiCodec({
    openaiApiKey,
    anthropicApiKey,
  });
}

// schema for serialized workflow format in the database
// this type is not precise but it's better than nothing
export const v2WorkflowDataSchema = z.object({
  entrypoint: z.object({
    entityType: z.literal("workflow"),
    pos: z.number(),
  }),
  bundle: z.any(),
});

export type V2WorkflowData = z.infer<typeof v2WorkflowDataSchema>;
