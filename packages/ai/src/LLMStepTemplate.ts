import { Artifact, ArtifactKind } from "./Artifact.js";
import { LogEntry } from "./Logger.js";
import { PromptPair } from "./prompts.js";

export type ErrorType = "CRITICAL" | "MINOR";

export type StepState<Shape extends IOShape> =
  | {
      kind: "PENDING";
    }
  | {
      kind: "DONE";
      durationMs: number;
      outputs: Outputs<Shape>;
    }
  | {
      kind: "FAILED";
      errorType: ErrorType;
      durationMs: number;
      message: string;
    };

export type OutputKind = ArtifactKind | `${ArtifactKind}?`;

export type IOShape<
  I extends Record<string, ArtifactKind> = Record<string, ArtifactKind>,
  O extends Record<string, OutputKind> = Record<string, OutputKind>,
> = {
  inputs: I;
  outputs: O;
};

export type Inputs<Shape extends IOShape<any, any>> = {
  [K in keyof Shape["inputs"]]: Extract<Artifact, { kind: Shape["inputs"][K] }>;
};

// Possible output value based on output kind.
// For example, if the step specifies `code: "code"`, then the value can be
// a code artifact or a string (the code itself).
// If the step specifies `code: "code?"`, then the value can be any of those or it can be undefined.
type AllowedOutputValue<Kind extends OutputKind> = Kind extends ArtifactKind
  ? Extract<Artifact, { kind: Kind }>
  : Kind extends `${infer ArtifactKind}?`
    ? Extract<Artifact, { kind: ArtifactKind }> | undefined
    : never;

export type Outputs<Shape extends IOShape<any, any>> = {
  [K in keyof Shape["outputs"]]: AllowedOutputValue<Shape["outputs"][K]>;
};

type StepExecuteResult<Shape extends IOShape> = {
  [K in keyof Shape["outputs"]]:
    | AllowedOutputValue<Shape["outputs"][K]>
    | NonNullable<AllowedOutputValue<Shape["outputs"][K]>>["value"];
};

// ExecuteContext is the context that's available to the step implementation.
// We intentionally don't pass the reference to the step implementation, so that steps won't mess with their internal state.
export type ExecuteContext = {
  queryLLM(promptPair: PromptPair): Promise<string | null>;
  log(log: LogEntry): void;
  fail(errorType: ErrorType, message: string): never;
};

/*
 * This is a type that's used to prepare the step for execution. `PreparedStep`
 * will be converted by `Workflow.addStep()` to `LLMStepInstance`.
 *
 * Notes:
 * 1) We can't just use LLMStepInstance here, this would cause nasty circular
 * dependencies (sometimes even Node.js crashes! seriously).
 * 2) We can't use a pair of template and inputs, because their generic
 * parameters must be synchronized, and TypeScript can't express that. So we
 * need to produce a PreparedStep from a template method.
 *
 * So, in total, we have three related types:
 * - `LLMStepTemplate`
 * - `LLMStepInstance`
 * - `PreparedStep`
 *
 * (And also `StepParams` and `SerializedStep` in `LLMStepInstance`...)
 *
 * If this sounds messy, it is. I really tried to find other approaches, but
 * fixing this would require giving up on `Shape` generic parameters, which has
 * its own issues.
 */
export type PreparedStep<Shape extends IOShape> = {
  template: LLMStepTemplate<Shape>;
  inputs: Inputs<Shape>;
};

export class LLMStepTemplate<const Shape extends IOShape = IOShape> {
  constructor(
    public readonly name: string,
    public readonly shape: Shape,
    /**
     * This function is the main API for implementing steps.
     *
     * It takes the context and inputs, and returns the outputs.
     *
     * The returned value must match the template's shape. For example, if the
     * shape has `{ outputs: { result: 'code' }}`, then the result must be an
     * object with a `result` property that's either a code artifact, or a value
     * of such artifact.
     *
     * It's possible to use optional outputs, but only if the shape has `?` in
     * the output kind. In this case, you must return `{ result: undefined }`.
     *
     * See the individual step implementations in `./steps/*.ts` for examples.
     *
     * If the step has failed, you can call `context.fail()` to stop execution.
     */
    public readonly execute: (
      context: ExecuteContext,
      inputs: Inputs<Shape>
    ) => Promise<StepExecuteResult<Shape>>
  ) {}

  prepare(inputs: Inputs<Shape>): PreparedStep<Shape> {
    return {
      template: this,
      inputs,
    };
  }
}
