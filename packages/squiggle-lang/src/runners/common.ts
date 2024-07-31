import { analyzeAst } from "../analysis/index.js";
import { compileAst } from "../compiler/index.js";
import { Reducer } from "../reducer/Reducer.js";
import { Err, Ok } from "../utility/result.js";
import { RunParams, RunResult } from "./BaseRunner.js";

export function baseRun(
  // `source` is not used, and we don't pass it to worker in WebWorkerRunner;
  // it's fine if some code passes the full `RunParams` here though.
  params: Omit<RunParams, "source">
): RunResult {
  const irResult = compileAst({
    ast: analyzeAst(params.ast),
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
