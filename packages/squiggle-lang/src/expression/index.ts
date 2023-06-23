/*
 * An expression is an intermediate representation of a Squiggle code.
 * Expressions are evaluated by reducer's `evaluate` function.
 */
import { ASTNode } from "../ast/parse.js";
import { Value, vBool, vNumber, vString, vVoid } from "../value/index.js";

// All shapes are type+value, to help with V8 monomorphism.
export type ExpressionContent =
  | {
      type: "Block";
      value: Expression[];
    }
  | {
      // programs are similar to blocks, but don't create an inner scope. there can be only one program at the top level of the expression.
      type: "Program";
      value: Expression[];
    }
  | {
      type: "Array";
      value: Expression[];
    }
  | {
      type: "Record";
      value: [Expression, Expression][];
    }
  | {
      type: "ResolvedSymbol";
      value: {
        name: string;
        // Position on stack, counting backwards (so last variable on stack has offset=0).
        // It's important to count backwards, because we want to store imports and continues on top of the stack.
        // (And maybe stdLib too, in the future.)
        offset: number;
      };
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
      };
    }
  | {
      type: "Lambda";
      value: {
        name?: string;
        parameters: string[];
        body: Expression;
      };
    }
  | {
      type: "Value";
      value: Value;
    };

export type Expression = ExpressionContent & { ast: ASTNode };

export const eArray = (anArray: Expression[]): ExpressionContent => ({
  type: "Array",
  value: anArray,
});

export const eValue = (value: Value): ExpressionContent => ({
  type: "Value",
  value,
});

export const eCall = (
  fn: Expression,
  args: Expression[]
): ExpressionContent => ({
  type: "Call",
  value: {
    fn,
    args,
  },
});

export const eLambda = (
  name: string | undefined,
  parameters: string[],
  body: Expression
): ExpressionContent => ({
  type: "Lambda",
  value: {
    name,
    parameters,
    body,
  },
});

export const eRecord = (
  aMap: [Expression, Expression][]
): ExpressionContent => ({
  type: "Record",
  value: aMap,
});

export const eResolvedSymbol = (
  name: string,
  offset: number
): ExpressionContent => ({
  type: "ResolvedSymbol",
  value: { name, offset },
});

export const eBlock = (exprs: Expression[]): ExpressionContent => ({
  type: "Block",
  value: exprs,
});

export const eProgram = (statements: Expression[]): ExpressionContent => ({
  type: "Program",
  value: statements,
});

export const eLetStatement = (
  left: string,
  right: Expression
): ExpressionContent => ({
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
): ExpressionContent => ({
  type: "Ternary",
  value: {
    condition,
    ifTrue,
    ifFalse,
  },
});

export const eVoid = (): ExpressionContent => ({
  type: "Value",
  value: vVoid(),
});

// Converts the expression to String. Useful for tests.
export function expressionToString(expression: Expression): string {
  switch (expression.type) {
    case "Block":
      return `{${expression.value.map(expressionToString).join("; ")}}`;
    case "Program":
      return expression.value.map(expressionToString).join("; ");
    case "Array":
      return `[${expression.value.map(expressionToString).join(", ")}]`;
    case "Record":
      return `{${expression.value
        .map(
          ([key, value]) =>
            `${expressionToString(key)}: ${expressionToString(value)}`
        )
        .join(", ")}}`;
    case "ResolvedSymbol":
      return `${expression.value.name}{${expression.value.offset}}`;
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
    case "Lambda":
      return `{|${expression.value.parameters.join(", ")}| ${expressionToString(
        expression.value.body
      )}}`;
    case "Value":
      return expression.value.toString();
    default:
      return `Unknown expression ${expression}`;
  }
}
