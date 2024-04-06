import { compileAst } from "../../expression/compile.js";
import { AST, Env, SqCompileError } from "../../index.js";
import { getStdLib } from "../../library/index.js";
import { Reducer } from "../../reducer/Reducer.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { errMap } from "../../utility/result.js";
import { Value, vDict } from "../../value/index.js";
import {
  deserializeValue,
  SerializedValue,
  serializeValue,
} from "../../value/serialize.js";

type SquiggleJob = {
  environment: Env;
  ast: AST;
  externals: SerializedValue;
  sourceId: string;
};

export type SquiggleJobResult = {
  result: SerializedValue;
  bindings: SerializedValue;
  exports: SerializedValue;
};

addEventListener("message", (e) => {
  const { environment, ast, externals, sourceId }: SquiggleJob = e.data;

  const externalsValue = deserializeValue(externals);
  if (externalsValue.type !== "Dict") {
    throw new Error("Expected externals to be a dictionary");
  }

  const expressionResult = errMap(
    compileAst(ast, getStdLib().merge(externalsValue.value)),
    (e) => new SqCompileError(e)
  );

  if (!expressionResult.ok) {
    throw new Error("Expected expression to be ok");
  }
  const expression = expressionResult.value;

  const reducer = new Reducer(environment);

  if (expression.kind !== "Program") {
    // mostly for TypeScript, so that we could access `expression.value.exports`
    throw new Error("Expected Program expression");
  }

  const result = reducer.evaluate(expression);

  const exportNames = new Set(expression.value.exports);
  const bindings = ImmutableMap<string, Value>(
    Object.entries(expression.value.bindings).map(([name, offset]) => {
      let value = reducer.stack.get(offset);
      if (exportNames.has(name)) {
        value = value.mergeTags({
          exportData: {
            sourceId,
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

  const output = {
    result: serializeValue(result),
    bindings: serializeValue(vDict(bindings)),
    exports: serializeValue(
      vDict(exports).mergeTags({
        exportData: {
          sourceId,
          path: [],
        },
      })
    ),
  };

  postMessage(output);
});
