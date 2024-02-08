/**
 * An "Expression" is an intermediate representation of a Squiggle code.
 *
 * Note that expressions are not "things that evaluate to values"! The entire
 * Squiggle program is also an expression. (Maybe we should rename this to
 * "IR".) Expressions are evaluated by reducer's `evaluate` function.
 *
 * Also, our IR is not flattened, so we can't call it a "bytecode" yet.
 *
 * The main difference between our IR and AST is that in IR, variable names are
 * resolved to stack and capture references.
 */
import { ASTNode } from "../ast/parse.js";
import { sExpr, SExpr, sExprToString } from "../utility/sExpr.js";
import { Value } from "../value/index.js";

export type LambdaExpressionParameter = {
  name: string;
  annotation?: Expression;
};

// All shapes are kind+value, to help with V8 monomorphism.
// **Don't** inject any more fields on this or try to flatten `value` props, it will only make things slower.
type MakeExpressionContent<Kind extends string, Value> = {
  kind: Kind;
  value: Value;
};

export type ExpressionContent =
  // Programs are similar to blocks, but they can export things for other modules to use.
  // There can be only one program at the top level of the expression.
  | MakeExpressionContent<
      "Program",
      {
        statements: Expression[];
        exports: string[]; // all exported names
        bindings: Record<string, number>; // variable name -> stack offset mapping
      }
    >
  | MakeExpressionContent<"Block", Expression[]>
  | MakeExpressionContent<
      "StackRef",
      /**
       * Position on stack, counting backwards (so last variable on stack has
       * offset=0).  It's important to count backwards, because we want to store
       * imports and continues on top of the stack.  (And maybe stdLib too, in
       * the future.)
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
  | MakeExpressionContent<
      "CaptureRef",
      number // Position in captures
    >
  // Ternaries can't be simplified to calls, because they're lazy.
  // (In a way, ternaries is the only way to do control flow in Squiggle.)
  | MakeExpressionContent<
      "Ternary",
      {
        condition: Expression;
        ifTrue: Expression;
        ifFalse: Expression;
      }
    >
  // Both variable definitions (`x = 5`) and function definitions (`f(x) = x`) compile to this.
  | MakeExpressionContent<
      "Assign",
      {
        left: string;
        right: Expression;
      }
    >
  | MakeExpressionContent<
      "Call",
      {
        fn: Expression;
        args: Expression[];
        // Note that `Decorate` is applied to values, not to statements;
        // decorated statements get rewritten in `./compile.ts`. If "decorate"
        // is set, the call will work only on lambdas marked with `isDecorator:
        // true`.
        as: "call" | "decorate";
      }
    >
  | MakeExpressionContent<
      "Lambda",
      {
        name?: string;
        // Lambda values produced by lambda expressions carry captured values
        // with them. `captures` are references to values that should be stored
        // in lambda. Captures can come either from the stack, or from captures
        // of the enclosing function.
        captures: Ref[];
        parameters: LambdaExpressionParameter[];
        body: Expression;
      }
    >
  | MakeExpressionContent<"Array", Expression[]>
  | MakeExpressionContent<"Dict", [Expression, Expression][]>
  // Constants or external references that were inlined during compilation.
  | MakeExpressionContent<"Value", Value>;

export type ExpressionContentByKind<T extends ExpressionContent["kind"]> =
  Extract<ExpressionContent, { kind: T }>;

export type Ref = ExpressionContentByKind<"StackRef" | "CaptureRef">;

export type Expression = ExpressionContent & { ast: ASTNode };

export type ExpressionByKind<T extends ExpressionContent["kind"]> = Extract<
  Expression,
  { kind: T }
>;

export const eCall = (
  fn: Expression,
  args: Expression[],
  as: "call" | "decorate" = "call"
): ExpressionContentByKind<"Call"> => ({
  kind: "Call",
  value: {
    fn,
    args,
    as,
  },
});

export function make<Kind extends ExpressionContent["kind"]>(
  kind: Kind,
  value: ExpressionContentByKind<Kind>["value"]
): ExpressionContentByKind<Kind> {
  return {
    kind,
    value,
    // Need to cast explicitly because TypeScript doesn't support `oneof` yet; `Kind` type parameter could be a union.
  } as ExpressionContentByKind<Kind>;
}

/**
 * Converts the expression to string. Useful for tests.
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
export function expressionToString(
  expression: ExpressionContent,
  { pretty = true }: { pretty?: boolean } = {}
): string {
  const toSExpr = (expression: ExpressionContent): SExpr => {
    const selfExpr = (args: (SExpr | undefined)[]): SExpr => ({
      name: expression.kind,
      args,
    });

    switch (expression.kind) {
      case "Block":
        return selfExpr(expression.value.map(toSExpr));
      case "Program":
        return selfExpr([
          sExpr(".statements", expression.value.statements.map(toSExpr)),
          Object.keys(expression.value.bindings).length
            ? sExpr(
                ".bindings",
                Object.entries(expression.value.bindings).map(
                  ([name, offset]) => sExpr(name, [offset])
                )
              )
            : undefined,
          expression.value.exports.length
            ? sExpr(".exports", expression.value.exports)
            : undefined,
        ]);
      case "Array":
        return selfExpr(expression.value.map(toSExpr));
      case "Dict":
        return selfExpr(
          expression.value.map((pair) => sExpr("kv", pair.map(toSExpr)))
        );
      case "StackRef":
        return selfExpr([expression.value]);
      case "CaptureRef":
        return selfExpr([expression.value]);
      case "Ternary":
        return selfExpr(
          [
            expression.value.condition,
            expression.value.ifTrue,
            expression.value.ifFalse,
          ].map(toSExpr)
        );
      case "Assign":
        return selfExpr([
          expression.value.left,
          toSExpr(expression.value.right),
        ]);
      case "Call":
        return selfExpr(
          [expression.value.fn, ...expression.value.args].map(toSExpr)
        );
      case "Lambda":
        return selfExpr([
          expression.value.captures.length
            ? sExpr(".captures", expression.value.captures.map(toSExpr))
            : undefined,
          sExpr(
            ".parameters",
            expression.value.parameters.map((parameter) =>
              parameter.annotation
                ? sExpr(".annotated", [
                    parameter.name,
                    toSExpr(parameter.annotation),
                  ])
                : parameter.name
            )
          ),
          toSExpr(expression.value.body),
        ]);
      case "Value":
        return expression.value.toString();
      default:
        return `Unknown expression ${expression satisfies never}`;
    }
  };

  return sExprToString(toSExpr(expression), { pretty });
}
