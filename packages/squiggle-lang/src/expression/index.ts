import { AST } from "../ast/parse";
import { Value, vBool, vNumber, vString, vVoid } from "../value";

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
      condition: Expression;
      ifTrue: Expression;
      ifFalse: Expression;
    }
  | {
      type: "Assign";
      left: string;
      right: Expression;
    }
  | {
      type: "Call";
      fn: Expression;
      args: Expression[];
    }
  | {
      type: "Lambda";
      parameters: string[];
      body: Expression;
      name?: string;
    }
  | {
      type: "Value";
      value: Value;
    };

export type Expression = ExpressionContent & { ast: AST };

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
  fn,
  args,
});

export const eLambda = (
  parameters: string[],
  body: Expression,
  name: string | undefined
): ExpressionContent => ({
  type: "Lambda",
  parameters,
  body,
  name,
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

export const eProgram = (exprs: Expression[]): ExpressionContent => ({
  type: "Program",
  value: exprs,
});

export const eLetStatement = (
  left: string,
  right: Expression
): ExpressionContent => ({
  type: "Assign",
  left,
  right,
});

export const eTernary = (
  condition: Expression,
  ifTrue: Expression,
  ifFalse: Expression
): ExpressionContent => ({
  type: "Ternary",
  condition,
  ifTrue,
  ifFalse,
});

export const eIdentifier = (name: string): ExpressionContent => ({
  type: "Symbol",
  value: name,
});

export const eVoid = (): ExpressionContent => ({
  type: "Value",
  value: vVoid(),
});
