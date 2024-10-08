import { z } from "zod";

import {
  LlmId,
  MODEL_CONFIGS,
  type SquiggleWorkflowInput,
} from "@quri/squiggle-ai";

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

export const createRequestBodySchema = z.object({
  prompt: z.string().optional(),
  squiggleCode: z.string().optional(),
  model: z.enum(MODEL_CONFIGS.map((model) => model.id) as ModelKeys).optional(),
});

export type CreateRequestBody = z.infer<typeof createRequestBodySchema>;

export function requestToInput(
  request: CreateRequestBody
): SquiggleWorkflowInput {
  return request.squiggleCode
    ? { type: "Edit", source: request.squiggleCode }
    : { type: "Create", prompt: request.prompt ?? "" };
}

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
