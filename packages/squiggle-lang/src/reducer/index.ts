import { parse } from "../ast/parse.js";
import { compileAst } from "../compiler/compile.js";
import { ProgramIR } from "../compiler/types.js";
import { defaultEnv } from "../dists/env.js";
import { ICompileError, IRuntimeError } from "../errors/IError.js";
import { getStdLib } from "../library/index.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { Reducer } from "./Reducer.js";

export async function evaluateIRToResult(
  ir: ProgramIR
): Promise<result<Value, IRuntimeError>> {
  const reducer = new Reducer(defaultEnv);
  try {
    const value = reducer.evaluate(ir);
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
    return await evaluateIRToResult(exprR.value);
  } else {
    return Result.Err(exprR.value);
  }
}
