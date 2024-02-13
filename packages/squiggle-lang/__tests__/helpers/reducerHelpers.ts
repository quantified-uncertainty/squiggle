import { nodeResultToString, parse } from "../../src/ast/parse.js";
import { ICompileError, IRuntimeError } from "../../src/errors/IError.js";
import { evaluateStringToResult } from "../../src/reducer/index.js";
import * as Result from "../../src/utility/result.js";
import { Value } from "../../src/value/index.js";

const expectParseToBe = (expr: string, answer: string) => {
  expect(nodeResultToString(parse(expr, "test"), { pretty: false })).toBe(
    answer
  );
};

const resultToString = (
  r: Result.result<Value, ICompileError | IRuntimeError>
) => (r.ok ? r.value.toString() : `Error(${r.value.toString()})`);

export const testParse = (code: string, answer: string) =>
  test(code, () => expectParseToBe(code, answer));

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

export function testEvalToMatch(
  expr: string,
  expected: string | RegExp,
  only = false
) {
  const fn = only ? test.only : test;
  fn(expr, async () => await expectEvalToMatch(expr, expected));
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
