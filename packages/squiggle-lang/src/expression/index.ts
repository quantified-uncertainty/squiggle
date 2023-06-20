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
      type: "Symbol";
      value: string;
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
        parameters: string[];
        body: Expression;
        name?: string;
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

export const eBool = (b: boolean): ExpressionContent => ({
  type: "Value",
  value: vBool(b),
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
  parameters: string[],
  body: Expression,
  name: string | undefined
): ExpressionContent => ({
  type: "Lambda",
  value: {
    parameters,
    body,
    name,
  },
});

export const eNumber = (x: number): ExpressionContent => ({
  type: "Value",
  value: vNumber(x),
});

export const eRecord = (
  aMap: [Expression, Expression][]
): ExpressionContent => ({
  type: "Record",
  value: aMap,
});

export const eString = (s: string): ExpressionContent => ({
  type: "Value",
  value: vString(s),
});

export const eSymbol = (name: string): ExpressionContent => ({
  type: "Symbol",
  value: name,
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
    case "Symbol":
      return expression.value;
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
