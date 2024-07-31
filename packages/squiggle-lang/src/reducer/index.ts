import { parse } from "../ast/parse.js";
import { compileAst } from "../compiler/index.js";
import { ProgramIR } from "../compiler/types.js";
import { defaultEnv } from "../dists/env.js";
import { ICompileError, IRuntimeError } from "../errors/IError.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { Reducer } from "./Reducer.js";

// These helper functions are used only in tests.

export async function evaluateIRToResult(
  ir: ProgramIR
): Promise<result<Value, IRuntimeError>> {
  const reducer = new Reducer(defaultEnv);
  try {
    const { result } = reducer.evaluate(ir);
    return Ok(result);
  } catch (e) {
    return Result.Err(reducer.errorFromException(e));
  }
}

export async function evaluateStringToResult(
  code: string
): Promise<result<Value, ICompileError | IRuntimeError>> {
  const exprR = Result.bind(parse(code, "main"), (ast) =>
    compileAst({ ast, imports: {} })
  );

  if (exprR.ok) {
    return await evaluateIRToResult(exprR.value);
  } else {
    return Result.Err(exprR.value);
  }
}
