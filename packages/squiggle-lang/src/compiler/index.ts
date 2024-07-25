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
import {
  sExpr,
  SExpr,
  SExprPrintOptions,
  sExprToString,
} from "../utility/sExpr.js";
import { Value } from "../value/index.js";

export type LambdaIRParameter = {
  name: string;
  annotation: IR | undefined;
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
        statements: IR[];
        result: IR | undefined;
        exports: string[]; // all exported names
        bindings: Record<string, number>; // variable name -> stack offset mapping
      }
    >
  | MakeIRContent<
      "Block",
      {
        statements: IR[];
        result: IR;
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
        condition: IR;
        ifTrue: IR;
        ifFalse: IR;
      }
    >
  // Both variable definitions (`x = 5`) and function definitions (`f(x) = x`) compile to this.
  | MakeIRContent<
      "Assign",
      {
        left: string;
        right: IR;
      }
    >
  | MakeIRContent<
      "Call",
      {
        fn: IR;
        args: IR[];
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
        body: IR;
      }
    >
  | MakeIRContent<"Array", IR[]>
  | MakeIRContent<"Dict", [IR, IR][]>
  // Constants or external references that were inlined during compilation.
  | MakeIRContent<"Value", Value>;

export type IRContentByKind<T extends IRContent["kind"]> = Extract<
  IRContent,
  { kind: T }
>;

export type Ref = IRContentByKind<"StackRef" | "CaptureRef">;

export type IR = IRContent & { location: LocationRange };

export type IRByKind<T extends IRContent["kind"]> = Extract<IR, { kind: T }>;

export const eCall = (
  fn: IR,
  args: IR[],
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

/**
 * Converts the IR to string. Useful for tests.
 * Example:

(Program
  (.statements
    (Assign
      f
      (Block 99)
    )
    (Assign
      g
      (Lambda
        (.captures
          (StackRef 0)
        )
        (.parameters x)
        (Block
          (CaptureRef 0)
        )
      )
    )
    (Call
      (StackRef 0)
      2
    )
  )
  (.bindings
    (f 1)
    (g 0)
  )
)

 */
export function irToString(
  ir: IRContent,
  printOptions: SExprPrintOptions = {}
): string {
  const toSExpr = (ir: IRContent): SExpr => {
    const selfExpr = (args: (SExpr | undefined)[]): SExpr => ({
      name: ir.kind,
      args,
    });

    switch (ir.kind) {
      case "Block":
        return selfExpr([...ir.value.statements, ir.value.result].map(toSExpr));
      case "Program":
        return selfExpr([
          ir.value.statements.length
            ? sExpr(".statements", ir.value.statements.map(toSExpr))
            : undefined,
          Object.keys(ir.value.bindings).length
            ? sExpr(
                ".bindings",
                Object.entries(ir.value.bindings).map(([name, offset]) =>
                  sExpr(name, [offset])
                )
              )
            : undefined,
          ir.value.exports.length
            ? sExpr(".exports", ir.value.exports)
            : undefined,
          ir.value.result ? toSExpr(ir.value.result) : undefined,
        ]);
      case "Array":
        return selfExpr(ir.value.map(toSExpr));
      case "Dict":
        return selfExpr(ir.value.map((pair) => sExpr("kv", pair.map(toSExpr))));
      case "StackRef":
        return selfExpr([ir.value]);
      case "CaptureRef":
        return selfExpr([ir.value]);
      case "Ternary":
        return selfExpr(
          [ir.value.condition, ir.value.ifTrue, ir.value.ifFalse].map(toSExpr)
        );
      case "Assign":
        return selfExpr([ir.value.left, toSExpr(ir.value.right)]);
      case "Call":
        return selfExpr([ir.value.fn, ...ir.value.args].map(toSExpr));
      case "Lambda":
        return selfExpr([
          ir.value.captures.length
            ? sExpr(".captures", ir.value.captures.map(toSExpr))
            : undefined,
          sExpr(
            ".parameters",
            ir.value.parameters.map((parameter) =>
              parameter.annotation
                ? sExpr(".annotated", [
                    parameter.name,
                    toSExpr(parameter.annotation),
                  ])
                : parameter.name
            )
          ),
          toSExpr(ir.value.body),
        ]);
      case "Value":
        return ir.value.toString();
      default:
        return `Unknown IR node ${ir satisfies never}`;
    }
  };

  return sExprToString(toSExpr(ir), printOptions);
}
