/*
 * An expression is an intermediate representation of a Squiggle code.
 * Expressions are evaluated by reducer's `evaluate` function.
 */
import { ASTNode } from "../ast/parse.js";
import { Value } from "../value/index.js";

export type LambdaExpressionParameter = {
  name: string;
  annotation?: Expression;
};

// All shapes are type+value, to help with V8 monomorphism.
export type ExpressionContent =
  | {
      type: "Block";
      value: Expression[];
    }
  | {
      // Programs are similar to blocks, but they can export things for other modules to use.
      // There can be only one program at the top level of the expression.
      type: "Program";
      value: {
        statements: Expression[];
        exports: string[];
        bindings: Record<string, number>; // numbers are stack references
      };
    }
  | {
      type: "Array";
      value: Expression[];
    }
  | {
      type: "Dict";
      value: [Expression, Expression][];
    }
  | {
      type: "StackRef";
      // Position on stack, counting backwards (so last variable on stack has offset=0).
      // It's important to count backwards, because we want to store imports and continues on top of the stack.
      // (And maybe stdLib too, in the future.)
      value: number;
    }
  | {
      // Captures are stored separately from values on stack, because we store captures once when the lambda is created, and copying captures to stack on every call would be more expensive.
      type: "CaptureRef";
      value: number; // Position in captures
    }
  | {
      type: "Ternary";
      value: {
        condition: Expression;
        ifTrue: Expression;
        ifFalse: Expression;
      };
    }
  | {
      type: "Assign";
      value: {
        left: string;
        right: Expression;
      };
    }
  | {
      type: "Call";
      value: {
        fn: Expression;
        args: Expression[];
        // Note that `Decorate` is applied to values, not to statements; decorated statements get rewritten in `./compile.ts`.
        // If "decorate" is set, the call will work only on lambdas marked with `isDecorator: true`.
        as: "call" | "decorate";
      };
    }
  | {
      type: "Lambda";
      value: {
        name?: string;
        // Lambda values produced by lambda expressions carry captured values with them.
        // `captures` are references to values that should be stored in lambda.
        // Captures can come either from the stack, or from captures of the enclosing function.
        captures: Ref[];
        parameters: LambdaExpressionParameter[];
        body: Expression;
      };
    }
  | {
      type: "Value";
      value: Value;
    };

export type TypedExpressionContent<T extends ExpressionContent["type"]> =
  Extract<ExpressionContent, { type: T }>;

export type Ref = TypedExpressionContent<"StackRef" | "CaptureRef">;

export type Expression = ExpressionContent & { ast: ASTNode };

export type TypedExpression<T extends ExpressionContent["type"]> =
  TypedExpressionContent<T> & { ast: ASTNode };

export const eArray = (
  anArray: Expression[]
): TypedExpressionContent<"Array"> => ({
  type: "Array",
  value: anArray,
});

export const eValue = (value: Value): TypedExpressionContent<"Value"> => ({
  type: "Value",
  value,
});

export const eCall = (
  fn: Expression,
  args: Expression[],
  as: "call" | "decorate" = "call"
): TypedExpressionContent<"Call"> => ({
  type: "Call",
  value: {
    fn,
    args,
    as,
  },
});

export const eLambda = (
  name: string | undefined,
  captures: Ref[],
  parameters: LambdaExpressionParameter[],
  body: Expression
): TypedExpressionContent<"Lambda"> => ({
  type: "Lambda",
  value: {
    name,
    captures,
    parameters,
    body,
  },
});

export const eDict = (
  value: [Expression, Expression][]
): TypedExpressionContent<"Dict"> => ({
  type: "Dict",
  value,
});

export const eStackRef = (
  value: number
): TypedExpressionContent<"StackRef"> => ({
  type: "StackRef",
  value,
});

export const eCaptureRef = (
  value: number
): TypedExpressionContent<"CaptureRef"> => ({
  type: "CaptureRef",
  value,
});

export const eBlock = (
  exprs: Expression[]
): TypedExpressionContent<"Block"> => ({
  type: "Block",
  value: exprs,
});

export const eProgram = (
  statements: Expression[],
  exports: string[],
  bindings: Record<string, number>
): TypedExpressionContent<"Program"> => ({
  type: "Program",
  value: {
    statements,
    exports,
    bindings,
  },
});

export const eLetStatement = (
  left: string,
  right: Expression
): TypedExpressionContent<"Assign"> => ({
  type: "Assign",
  value: {
    left,
    right,
  },
});

export const eTernary = (
  condition: Expression,
  ifTrue: Expression,
  ifFalse: Expression
): TypedExpressionContent<"Ternary"> => ({
  type: "Ternary",
  value: {
    condition,
    ifTrue,
    ifFalse,
  },
});

// Converts the expression to String. Useful for tests.
export function expressionToString(expression: ExpressionContent): string {
  switch (expression.type) {
    case "Block":
      return `{${expression.value.map(expressionToString).join("; ")}}`;
    case "Program": {
      const exports = new Set<string>(expression.value.exports);
      return expression.value.statements
        .map((statement) => {
          const statementString = expressionToString(statement);
          return statement.type === "Assign" &&
            exports.has(statement.value.left)
            ? `export ${statementString}`
            : statementString;
        })
        .join("; ");
    }
    case "Array":
      return `[${expression.value.map(expressionToString).join(", ")}]`;
    case "Dict":
      return `{${expression.value
        .map(
          ([key, value]) =>
            `${expressionToString(key)}: ${expressionToString(value)}`
        )
        .join(", ")}}`;
    case "StackRef":
      return `S[${expression.value}]`;
    case "CaptureRef":
      return `C[${expression.value}]`;
    case "Ternary":
      return `${expressionToString(
        expression.value.condition
      )} ? (${expressionToString(
        expression.value.ifTrue
      )}) : (${expressionToString(expression.value.ifFalse)})`;
    case "Assign":
      return `${expression.value.left} = ${expressionToString(
        expression.value.right
      )}`;
    case "Call":
      return `(${expressionToString(
        expression.value.fn
      )})(${expression.value.args.map(expressionToString).join(", ")})`;
    case "Lambda": {
      const captures = expression.value.captures
        .map(expressionToString)
        .join(", ");
      return `{[${captures}]|${expression.value.parameters
        .map((parameter) => parameter.name)
        .join(", ")}| ${expressionToString(expression.value.body)}}`;
    }
    case "Value":
      return expression.value.toString();
    default:
      return `Unknown expression ${expression satisfies never}`;
  }
}
