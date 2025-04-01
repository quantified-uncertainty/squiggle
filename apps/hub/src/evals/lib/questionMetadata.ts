import { z } from "zod";

import { Prisma } from "@quri/hub-db";

const schema = z.object({
  manifold: z
    .object({
      marketId: z.string(),
      marketUrl: z.string(),
    })
    .optional(),
});

export type QuestionMetadata = z.infer<typeof schema>;

export function parseQuestionMetadata(
  metadata: Prisma.JsonValue
): QuestionMetadata {
  const parsed = schema.safeParse(metadata);
  if (!parsed.success) {
    return {};
  }

  return parsed.data;
}
