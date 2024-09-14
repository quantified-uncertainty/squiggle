import { CodeState } from "./LLMStep";

export type Artifact =
  | {
      kind: "prompt";
      value: string;
    }
  | {
      kind: "code";
      value: string;
    }
  | {
      kind: "codeState";
      value: CodeState;
    };

export type ArtifactKind = Artifact["kind"];

export function getArtifactFullName(artifact: Artifact): string {
  switch (artifact.kind) {
    case "prompt":
      return "ℹ️ Prompt";
    case "code":
      return "📄 Code";
    case "codeState":
      return "📄 Code State";
    default:
      return `❓ Unknown (${artifact satisfies never})`;
  }
}
