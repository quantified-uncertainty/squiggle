import { nodeResultToString, parse } from "../../src/ast/parse.js";
import { compileAst } from "../../src/expression/compile.js";
import { expressionToString } from "../../src/expression/index.js";
import {
  evaluateExpressionToResult,
  evaluateStringToResult,
} from "../../src/reducer/index.js";
import * as Result from "../../src/utility/result.js";
import { ICompileError, IRuntimeError } from "../../src/errors/IError.js";
import { Value } from "../../src/value/index.js";
import { getStdLib } from "../../src/library/index.js";

const expectParseToBe = (expr: string, answer: string) => {
  expect(nodeResultToString(parse(expr, "test"))).toBe(answer);
};

const resultToString = (
  r: Result.result<Value, ICompileError | IRuntimeError>
) => (r.ok ? r.value.toString() : `Error(${r.value.toString()})`);

export const testParse = (expr: string, answer: string) =>
  test(expr, () => expectParseToBe(expr, answer));

async function expectExpressionToBe(expr: string, answer: string, v?: string) {
  const rExpr = Result.bind(parse(expr, "test"), (ast) =>
    compileAst(ast, getStdLib())
  );
  const a1 = rExpr.ok
    ? expressionToString(rExpr.value)
    : `Error(${rExpr.value.toString()})`;

  expect(a1).toBe(answer);

  if (v === undefined) {
    return;
  }

  const a2r: Result.result<Value, ICompileError | IRuntimeError> = rExpr.ok
    ? await evaluateExpressionToResult(rExpr.value)
    : Result.Err(rExpr.value);

  const a2 = resultToString(a2r);
  expect(a2).toBe(v);
}

export function testToExpression(expr: string, answer: string, v?: string) {
  test(expr, async () => await expectExpressionToBe(expr, answer, v));
}

async function expectEvalError(code: string) {
  expect(resultToString(await evaluateStringToResult(code))).toMatch(/Error\(/);
}

export function testEvalError(expr: string) {
  test(expr, async () => await expectEvalError(expr));
}

export async function expectEvalToBe(code: string, answer: string) {
  expect(resultToString(await evaluateStringToResult(code))).toBe(answer);
}

export async function expectEvalToMatch(
  code: string,
  expected: string | RegExp
) {
  expect(resultToString(await evaluateStringToResult(code))).toMatch(expected);
}

export function testEvalToBe(expr: string, answer: string, only = false) {
  only
    ? test.only(expr, async () => await expectEvalToBe(expr, answer))
    : test(expr, async () => await expectEvalToBe(expr, answer));
}

export function testEvalToMatch(expr: string, expected: string | RegExp) {
  test(expr, async () => await expectEvalToMatch(expr, expected));
}

export const MySkip = {
  testEvalToBe: (expr: string, answer: string) =>
    test.skip(expr, async () => await expectEvalToBe(expr, answer)),
  testParse: (expr: string, answer: string) =>
    test.skip(expr, () => expectParseToBe(expr, answer)),
};

export function testDescriptionEvalToBe(
  desc: string,
  expr: string,
  answer: string
) {
  test(desc, async () => await expectEvalToBe(expr, answer));
}
