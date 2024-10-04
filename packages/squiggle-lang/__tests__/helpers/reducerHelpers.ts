import { astResultToString, parse } from "../../src/ast/parse.js";
import { ProgramIR } from "../../src/compiler/types.js";
import { defaultEnv } from "../../src/dists/env.js";
import { ICompileError, IRuntimeError } from "../../src/errors/IError.js";
import { Reducer } from "../../src/reducer/Reducer.js";
import * as Result from "../../src/utility/result.js";
import { result } from "../../src/utility/result.js";
import { Value } from "../../src/value/index.js";
import { compileStringToIR } from "./compileHelpers.js";

export async function evaluateIRToResult(
  ir: ProgramIR
): Promise<Result.result<Value, IRuntimeError>> {
  const reducer = new Reducer(defaultEnv);
  try {
    const { result } = reducer.evaluate(ir);
    return Result.Ok(result);
  } catch (e) {
    return Result.Err(reducer.errorFromException(e));
  }
}

export async function evaluateStringToResult(
  code: string
): Promise<result<Value, ICompileError[] | IRuntimeError>> {
  const irR = compileStringToIR(code, "main");

  if (irR.ok) {
    return await evaluateIRToResult(irR.value);
  } else {
    return Result.Err(irR.value);
  }
}

const expectParseCommentsToBe = (expr: string, comments: string[]) => {
  const result = parse(expr, "test");
  if (result?.value && "comments" in result.value) {
    expect(result.value.comments.map((c) => c.value)).toEqual(comments);
  } else {
    fail("Parsing failed or result does not contain comments");
  }
};

const expectParseToBe = (expr: string, answer: string) => {
  expect(answer).toBe(
    astResultToString(parse(expr, "test"), { pretty: false })
  );
};

const resultToString = (
  r: Result.result<Value, ICompileError[] | IRuntimeError>
) => {
  if (r.ok) {
    return r.value.toString();
  }

  if (Array.isArray(r.value)) {
    return `Error(${r.value.map((e) => e.toString()).join("\n")})`;
  } else {
    return `Error(${r.value.toString()})`;
  }
};

export const testParseComments = (code: string, comments: string[]) =>
  test(code, () => expectParseCommentsToBe(code, comments));

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

export function testEvalToBe(expr: string, answer: string) {
  test(expr, async () => await expectEvalToBe(expr, answer));
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
