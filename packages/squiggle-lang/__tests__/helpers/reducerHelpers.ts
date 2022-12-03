import { nodeResultToString, parse, toStringError } from "../../src/ast/parse";
import { expressionFromAst } from "../../src/ast/toExpression";
import { expressionToString } from "../../src/expression";
import {
  evaluateExpressionToResult,
  evaluateStringToResult,
} from "../../src/reducer";
import * as Result from "../../src/utility/result";
import { IError } from "../../src/reducer/IError";
import { Value } from "../../src/value";

const expectParseToBe = (expr: string, answer: string) => {
  expect(nodeResultToString(parse(expr, "test"))).toBe(answer);
};

const resultToString = (r: Result.result<Value, IError>) =>
  r.ok ? r.value.toString() : `Error(${r.value.toString()})`;

export const testParse = (expr: string, answer: string) =>
  test(expr, () => expectParseToBe(expr, answer));

let expectExpressionToBe = (expr: string, answer: string, v?: string) => {
  const rExpr = Result.fmap(parse(expr, "test"), expressionFromAst);
  const a1 = rExpr.ok
    ? expressionToString(rExpr.value)
    : `Error(${toStringError(rExpr.value)})`;

  if (v === undefined) {
    expect(a1).toBe(answer);
  } else {
    const a2r = Result.bind(
      Result.errMap(rExpr, (e) => IError.fromParseError(e)),
      evaluateExpressionToResult
    );
    const a2 = resultToString(a2r);
    expect([a1, a2]).toEqual([answer, v]);
  }
};

export const testToExpression = (expr: string, answer: string, v?: string) =>
  test(expr, () => expectExpressionToBe(expr, answer, v));

const expectEvalError = (code: string) => {
  expect(resultToString(evaluateStringToResult(code))).toMatch(/Error\(/);
};

export const testEvalError = (expr: string) =>
  test(expr, () => expectEvalError(expr));

export const expectEvalToBe = (code: string, answer: string) => {
  expect(resultToString(evaluateStringToResult(code))).toBe(answer);
};

export const testEvalToBe = (expr: string, answer: string) =>
  test(expr, () => expectEvalToBe(expr, answer));

export const MySkip = {
  testEvalToBe: (expr: string, answer: string) =>
    test.skip(expr, () => expectEvalToBe(expr, answer)),
  testParse: (expr: string, answer: string) =>
    test.skip(expr, () => expectParseToBe(expr, answer)),
};

export const testDescriptionEvalToBe = (
  desc: string,
  expr: string,
  answer: string
) => test(desc, () => expectEvalToBe(expr, answer));
