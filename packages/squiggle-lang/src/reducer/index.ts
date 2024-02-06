import { parse } from "../ast/parse.js";
import { defaultEnv } from "../dist/env.js";
import { ICompileError, IRuntimeError } from "../errors/IError.js";
import { compileAst } from "../expression/compile.js";
import { Expression } from "../expression/index.js";
import { getStdLib } from "../library/index.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { Interpreter } from "./interpreter.js";

export async function evaluateExpressionToResult(
  expression: Expression
): Promise<result<Value, IRuntimeError>> {
  const context = new Interpreter(defaultEnv);
  try {
    const value = context.evaluate(expression);
    return Ok(value);
  } catch (e) {
    return Result.Err(context.errorFromException(e));
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
