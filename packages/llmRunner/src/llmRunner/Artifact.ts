import { Code } from "./CodeState";

export type Artifact =
  | {
      kind: "prompt";
      value: string;
    }
  | {
      kind: "source";
      value: string;
    }
  | {
      kind: "code";
      value: Code;
    };

export type ArtifactKind = Artifact["kind"];

export function getArtifactFullName(artifact: Artifact): string {
  switch (artifact.kind) {
    case "prompt":
      return "ℹ️ Prompt";
    case "source":
      return "📄 Source";
    case "code":
      return "📄 Code";
    default:
      return `❓ Unknown (${artifact satisfies never})`;
  }
}
