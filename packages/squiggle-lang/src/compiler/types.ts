/**
 * An "IR" is an intermediate representation of a Squiggle code.
 *
 * IR is evaluated by reducer's `evaluate` function.
 *
 * Our IR is nested because the interpreter relies on Javascript stack for
 * native function calls, so we can't call it a "bytecode" yet.
 *
 * The main difference between our IR and AST is that in IR, variable names are
 * resolved to stack and capture references.
 */
import { LocationRange } from "../ast/types.js";
import { Value } from "../value/index.js";

export type LambdaIRParameter = {
  name: string;
  annotation: AnyExpressionIR | undefined;
};

// All shapes are kind+value, to help with V8 monomorphism.
// **Don't** inject any more fields on this or try to flatten `value` props, it will only make things slower.
type MakeIRContent<Kind extends string, Payload> = {
  kind: Kind;
  value: Payload;
};

export type IRContent =
  // Programs are similar to blocks, but they can export things for other modules to use.
  // There can be only one program at the top level of the IR.
  | MakeIRContent<
      "Program",
      {
        statements: StatementIR[];
        result: AnyExpressionIR | undefined;
        exports: string[]; // all exported names
        bindings: Record<string, number>; // variable name -> stack offset mapping
      }
    >
  // Both variable definitions (`x = 5`) and function definitions (`f(x) = x`) compile to this.
  | MakeIRContent<
      "Assign",
      {
        left: string;
        right: AnyExpressionIR;
      }
    >
  // The remaining IR nodes are expressions.
  | MakeIRContent<
      "Block",
      {
        statements: StatementIR[];
        result: AnyExpressionIR;
      }
    >
  | MakeIRContent<
      "StackRef",
      /**
       * Position on stack, counting backwards (so last variable on stack has
       * offset=0).  It's important to count backwards, because we want to store
       * imports on top of the stack.  (And maybe stdLib too, in the future.)
       *
       * Important: a function should never reference values on stack beyond its
       * locals. Captures are referenced through `CaptureRef`s.  This is
       * guaranteed by the compiler.
       */
      number
    >
  // Captures are stored separately from values on stack, because we store
  // captures once when the lambda is created.  We could copy those stored
  // captures to stack on every call, but that would be more expensive.  See
  // also: https://en.wikipedia.org/wiki/Funarg_problem; supporting closures
  // mean that Squiggle can't be entirely stack-based.
  | MakeIRContent<
      "CaptureRef",
      number // Position in captures
    >
  // Ternaries can't be simplified to calls, because they're lazy.
  // (In a way, ternaries is the only way to do control flow in Squiggle.)
  | MakeIRContent<
      "Ternary",
      {
        condition: AnyExpressionIR;
        ifTrue: AnyExpressionIR;
        ifFalse: AnyExpressionIR;
      }
    >
  | MakeIRContent<
      "Call",
      {
        fn: AnyExpressionIR;
        args: AnyExpressionIR[];
        // Note that `Decorate` is applied to values, not to statements;
        // decorated statements get rewritten in `./compile.ts`. If "decorate"
        // is set, the call will work only on lambdas marked with `isDecorator:
        // true`.
        as: "call" | "decorate";
      }
    >
  | MakeIRContent<
      "Lambda",
      {
        name?: string;
        // Lambda values produced by lambda IR nodes carry captured values with
        // them. `captures` are references to values that should be stored in
        // lambda. Captures can come either from the stack, or from captures of
        // the enclosing function.
        captures: Ref[];
        parameters: LambdaIRParameter[];
        body: AnyExpressionIR;
      }
    >
  | MakeIRContent<"Array", AnyExpressionIR[]>
  | MakeIRContent<"Dict", [AnyExpressionIR, AnyExpressionIR][]>
  // Constants or external references that were inlined during compilation.
  | MakeIRContent<"Value", Value>;

export type IRContentByKind<T extends IRContent["kind"]> = Extract<
  IRContent,
  { kind: T }
>;
export type AnyExpressionIRContent = Exclude<
  IRContent,
  { kind: "Program" | "Assign" }
>;

export type Ref = IRContentByKind<"StackRef" | "CaptureRef">;

export type IR = IRContent & { location: LocationRange };

export type IRByKind<T extends IRContent["kind"]> = Extract<IR, { kind: T }>;

export type AnyExpressionIR = Exclude<IR, { kind: "Program" | "Assign" }>;
export type StatementIR = IRByKind<"Assign">;

export const eCall = (
  fn: AnyExpressionIR,
  args: AnyExpressionIR[],
  as: "call" | "decorate" = "call"
): IRContentByKind<"Call"> => ({
  kind: "Call",
  value: {
    fn,
    args,
    as,
  },
});

export function make<Kind extends IRContent["kind"]>(
  kind: Kind,
  value: IRContentByKind<Kind>["value"]
): IRContentByKind<Kind> {
  return {
    kind,
    value,
    // Need to cast explicitly because TypeScript doesn't support `oneof` yet; `Kind` type parameter could be a union.
  } as IRContentByKind<Kind>;
}
