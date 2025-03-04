import "server-only";

import { z } from "zod";

import { Prisma } from "@quri/hub-db";
import { ClientWorkflow } from "@quri/squiggle-ai";
import { Workflow } from "@quri/squiggle-ai/server";

import { getAiCodec } from "./utils";

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

export function workflowToV2_0Json(workflow: Workflow<any>): V2WorkflowData {
  const codec = getAiCodec();
  const serializer = codec.makeSerializer();
  const entrypoint = serializer.serialize("workflow", workflow);
  const bundle = serializer.getBundle();

  return { entrypoint, bundle };
}

export function decodeV2_0JsonToClientWorkflow(
  json: Prisma.JsonValue
): ClientWorkflow {
  /*
   * Here we go from SerializedWorkflow to Workflow to ClientWorkflow.
   *
   * TODO: Instead, we could go directly from SerializedWorkflow to
   * ClientWorkflow (useful especially if workflow implementation is
   * deprecated, so we can't resume it but still want to show it).
   */
  const { bundle, entrypoint } = v2WorkflowDataSchema.parse(json);
  const codec = getAiCodec();
  const deserializer = codec.makeDeserializer(bundle);
  const workflow = deserializer.deserialize(entrypoint);

  return workflow.asClientWorkflow();
}
