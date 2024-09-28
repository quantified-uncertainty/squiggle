import { DeserializationVisitor, makeCodec } from "@quri/serializer";

import { SerializationVisitor } from "../../serializer/dist/serialization.js";
import {
  Artifact,
  deserializeArtifact,
  serializeArtifact,
  SerializedArtifact,
} from "./Artifact.js";
import { LLMStepInstance, SerializedStep } from "./LLMStepInstance.js";
import { SerializedWorkflow, Workflow } from "./workflows/Workflow.js";

type AiShape = {
  workflow: [Workflow, SerializedWorkflow];
  step: [LLMStepInstance, SerializedStep];
  artifact: [Artifact, SerializedArtifact];
};

export type AiSerializationVisitor = SerializationVisitor<AiShape>;

export type AiDeserializationVisitor = DeserializationVisitor<AiShape>;

export function makeAiCodec(params: {
  // we don't want to serialize these secrets, so we parameterize the codec with them
  openaiApiKey?: string;
  anthropicApiKey?: string;
}) {
  return makeCodec<AiShape>({
    workflow: {
      serialize: (node, visitor) => node.serialize(visitor),
      deserialize: (node, visitor) =>
        Workflow.deserialize({
          node,
          visitor,
          openaiApiKey: params.openaiApiKey,
          anthropicApiKey: params.anthropicApiKey,
        }),
    },
    step: {
      serialize: (node, visitor) => node.serialize(visitor),
      deserialize: (node, visitor) =>
        LLMStepInstance.deserialize(node, visitor),
    },
    artifact: {
      serialize: serializeArtifact,
      deserialize: deserializeArtifact,
    },
  });
}
