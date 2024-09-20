import { Code } from "./CodeState.js";
import { LLMStepInstance } from "./LLMStep.js";

export class BaseArtifact<T extends string, V> {
  public readonly id: string;
  constructor(
    public readonly kind: T,
    public readonly value: V,
    public readonly createdBy: LLMStepInstance | undefined
  ) {
    this.id = crypto.randomUUID();
  }
}

export class PromptArtifact extends BaseArtifact<"prompt", string> {
  constructor(value: string, createdBy?: LLMStepInstance) {
    super("prompt", value, createdBy);
  }
}

export class SourceArtifact extends BaseArtifact<"source", string> {
  constructor(value: string, createdBy?: LLMStepInstance) {
    super("source", value, createdBy);
  }
}

export class CodeArtifact extends BaseArtifact<"code", Code> {
  constructor(value: Code, createdBy?: LLMStepInstance) {
    super("code", value, createdBy);
  }
}

export type Artifact = PromptArtifact | SourceArtifact | CodeArtifact;

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

type ArtifactValue<T extends ArtifactKind> = Extract<
  Artifact,
  { kind: T }
>["value"];

export function makeArtifact<T extends ArtifactKind>(
  kind: T,
  value: ArtifactValue<T>,
  createdBy: LLMStepInstance<any>
): Extract<Artifact, { kind: T }> {
  // sorry for the type casting, TypeScript is not smart enough to infer the type
  switch (kind) {
    case "prompt":
      return new PromptArtifact(
        value as ArtifactValue<"prompt">,
        createdBy
      ) as Extract<Artifact, { kind: T }>;
    case "source":
      return new SourceArtifact(
        value as ArtifactValue<"source">,
        createdBy
      ) as Extract<Artifact, { kind: T }>;
    case "code":
      return new CodeArtifact(
        value as ArtifactValue<"code">,
        createdBy
      ) as Extract<Artifact, { kind: T }>;
    default:
      throw kind satisfies never;
  }
}
