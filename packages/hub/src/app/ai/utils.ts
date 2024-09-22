import { z } from "zod";

import {
  LlmName,
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

type ModelKeys = UnionToTuple<LlmName>;

export const createRequestBodySchema = z.object({
  prompt: z.string().optional(),
  squiggleCode: z.string().optional(),
  model: z.enum(MODEL_CONFIGS.map((model) => model.id)).optional(),
});

export type CreateRequestBody = z.infer<typeof createRequestBodySchema>;

export function requestToInput(
  request: CreateRequestBody
): SquiggleWorkflowInput {
  return request.squiggleCode
    ? { type: "Edit", source: request.squiggleCode }
    : { type: "Create", prompt: request.prompt ?? "" };
}
