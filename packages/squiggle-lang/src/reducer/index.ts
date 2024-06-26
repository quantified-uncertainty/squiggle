import { parse } from "../ast/parse.js";
import { defaultEnv } from "../dists/env.js";
import { ICompileError, IRuntimeError } from "../errors/IError.js";
import { compileAst } from "../expression/compile.js";
import { Expression } from "../expression/index.js";
import { getStdLib } from "../library/index.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { Reducer } from "./Reducer.js";

export async function evaluateExpressionToResult(
  expression: Expression
): Promise<result<Value, IRuntimeError>> {
  const reducer = new Reducer(defaultEnv);
  try {
    const value = reducer.evaluate(expression);
    return Ok(value);
  } catch (e) {
    return Result.Err(reducer.errorFromException(e));
  }
}

export async function evaluateStringToResult(
  code: string
): Promise<result<Value, ICompileError | IRuntimeError>> {
  const exprR = Result.bind(parse(code, "main"), (ast) =>
    compileAst(ast, getStdLib())
  );

  if (exprR.ok) {
    return await evaluateExpressionToResult(exprR.value);
  } else {
    return Result.Err(exprR.value);
  }
}
