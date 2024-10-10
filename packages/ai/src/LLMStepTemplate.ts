import { Artifact, ArtifactKind } from "./Artifact.js";
import { LogEntry } from "./Logger.js";
import { PromptPair } from "./prompts.js";

export type ErrorType = "CRITICAL" | "MINOR";

export type StepState =
  | {
      kind: "PENDING";
    }
  | {
      kind: "DONE";
      durationMs: number;
    }
  | {
      kind: "FAILED";
      errorType: ErrorType;
      durationMs: number;
      message: string;
    };

export type IOShape<
  I extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
  O extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
> = {
  inputs: I;
  outputs: O;
};

export type Inputs<Shape extends IOShape<any, any>> = {
  [K in keyof Shape["inputs"]]: Extract<Artifact, { kind: Shape["inputs"][K] }>;
};

export type Outputs<Shape extends IOShape<any, any>> = {
  [K in keyof Shape["outputs"]]: Extract<
    Artifact,
    { kind: Shape["outputs"][K] }
  >;
};

// ExecuteContext is the context that's available to the step implementation.
// We intentionally don't pass the reference to the step implementation, so that steps won't mess with their internal state.
export type ExecuteContext<Shape extends IOShape> = {
  setOutput<K extends Extract<keyof Shape["outputs"], string>>(
    key: K,
    value: Outputs<Shape>[K] | Outputs<Shape>[K]["value"] // can be either the artifact or the value inside the artifact
  ): void;
  queryLLM(promptPair: PromptPair): Promise<string | null>;
  log(log: LogEntry): void;
  fail(errorType: ErrorType, message: string): void;
};

export class LLMStepTemplate<const Shape extends IOShape = IOShape> {
  constructor(
    public readonly name: string,
    public readonly shape: Shape,
    public readonly execute: (
      context: ExecuteContext<Shape>,
      inputs: Inputs<Shape>
    ) => Promise<void>
  ) {}
}
