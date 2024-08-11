import { parse } from "../ast/parse.js";
import { compileTypedAst } from "../compiler/index.js";
import { Reducer } from "../reducer/Reducer.js";
import { Err, Ok } from "../utility/result.js";
import { RunParams, RunResult } from "./BaseRunner.js";

export function baseRun(params: RunParams): RunResult {
  const astR = parse(params.module.code, params.module.name);
  if (!astR.ok) {
    return astR;
  }
  const typedAst = params.module.typedAst();
  if (!typedAst.ok) {
    return Err(typedAst.value._value);
  }
  const irResult = compileTypedAst({
    ast: typedAst.value,
    imports: params.imports,
  });

  if (!irResult.ok) {
    return irResult;
  }
  const ir = irResult.value;

  const reducer = new Reducer(params.environment);

  if (ir.kind !== "Program") {
    // mostly for TypeScript, so that we could access `ir.value.exports`
    throw new Error("Expected Program IR node");
  }

  try {
    return Ok(reducer.evaluate(ir));
  } catch (e: unknown) {
    return Err(reducer.errorFromException(e));
  }
}
