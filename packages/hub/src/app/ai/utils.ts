import { z } from "zod";

import { LlmId, MODEL_CONFIGS } from "@quri/squiggle-ai";

// SquiggleWorkflow input

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

type ModelKeys = UnionToTuple<LlmId>;

const commonRequestFields = {
  model: z.enum(MODEL_CONFIGS.map((model) => model.id) as ModelKeys).optional(),
  numericSteps: z.number(),
  styleGuideSteps: z.number(),
};

export const aiRequestBodySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create"),
    ...commonRequestFields,
    prompt: z.string(),
  }),
  z.object({
    kind: z.literal("edit"),
    ...commonRequestFields,
    squiggleCode: z.string(),
  }),
]);

export type AiRequestBody = z.infer<typeof aiRequestBodySchema>;

// Convert a ReadableStream (`response.body` from `fetch()`) to a line-by-line reader.
export function bodyToLineReader(stream: ReadableStream<string>) {
  let buffer = "";
  return stream
    .pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          buffer += chunk;
          const lines = buffer.split("\n");

          // Process all complete lines
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line) controller.enqueue(line);
          }

          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines[lines.length - 1];
        },
        flush(controller) {
          // Process any remaining data in the buffer
          if (buffer.trim()) controller.enqueue(buffer.trim());
        },
      })
    )
    .getReader();
}

// Human-readable names for the steps in the workflow
export const stepNames: Record<string, string> = {
  GenerateCode: "Generate",
  FixCodeUntilItRuns: "Fix",
  AdjustToFeedback: "Update Estimates",
  MatchStyleGuide: "Document",
  RunAndFormatCode: "Prepare",
};
