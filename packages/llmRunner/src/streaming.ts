import { Artifact } from "./Artifact.js";
import { SerializedArtifact } from "./types.js";

export function serializeArtifact(value: Artifact): SerializedArtifact {
  const commonArtifactFields = {
    id: value.id,
    createdBy: value.createdBy?.id,
  };
  switch (value.kind) {
    case "source":
      return {
        ...commonArtifactFields,
        kind: "source",
        value: value.value,
      };
    case "code":
      return {
        ...commonArtifactFields,
        kind: "code",
        value: value.value.source,
        ok: value.value.type === "success",
      };
    case "prompt":
      return {
        ...commonArtifactFields,
        kind: "prompt",
        value: value.value,
      };
    default:
      throw new Error(`Unknown artifact ${value satisfies never}`);
  }
}
