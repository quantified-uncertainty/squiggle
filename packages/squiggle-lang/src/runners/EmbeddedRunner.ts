import { compileAst } from "../expression/compile.js";
import { getStdLib } from "../library/index.js";
import { Reducer } from "../reducer/Reducer.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, Ok } from "../utility/result.js";
import { Value } from "../value/index.js";
import { vDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";

export class EmbeddedRunner extends BaseRunner {
  async run(params: RunParams): Promise<RunResult> {
    const expressionResult = compileAst(
      params.ast,
      getStdLib().merge(params.externals.value)
    );

    if (!expressionResult.ok) {
      return expressionResult;
    }
    const expression = expressionResult.value;

    const reducer = new Reducer(params.environment);

    if (expression.kind !== "Program") {
      // mostly for TypeScript, so that we could access `expression.value.exports`
      throw new Error("Expected Program expression");
    }

    let result: Value;
    try {
      result = reducer.evaluate(expression);
    } catch (e: unknown) {
      return Err(reducer.errorFromException(e));
    }

    const exportNames = new Set(expression.value.exports);
    const bindings = ImmutableMap<string, Value>(
      Object.entries(expression.value.bindings).map(([name, offset]) => {
        let value = reducer.stack.get(offset);
        if (exportNames.has(name)) {
          value = value.mergeTags({
            exportData: {
              sourceId: params.sourceId,
              path: [name],
            },
          });
        }
        return [name, value];
      })
    );
    const exports = bindings.filter(
      (value, _) => value.tags?.exportData() !== undefined
    );

    return Ok({
      result,
      bindings: vDict(bindings),
      exports: vDict(exports).mergeTags({
        exportData: {
          sourceId: params.sourceId,
          path: [],
        },
      }),
    });
  }
}
