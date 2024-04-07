import { compileAst } from "../../expression/compile.js";
import { AST, Env, SqCompileError } from "../../index.js";
import { getStdLib } from "../../library/index.js";
import { Reducer } from "../../reducer/Reducer.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import { errMap, result } from "../../utility/result.js";
import { Value, vDict } from "../../value/index.js";
import {
  deserializeValue,
  SerializedBundle,
  serializeValue,
} from "../../value/serialize.js";

type SquiggleJob = {
  environment: Env;
  ast: AST;
  externals: SerializedBundle;
  sourceId: string;
};

export type SquiggleJobResult = {
  result: SerializedBundle;
  bindings: SerializedBundle;
  exports: SerializedBundle;
};

export type SquiggleWorkerResponse = {
  type: "result";
  payload: result<SquiggleJobResult, string>;
};

function processJob(job: SquiggleJob): SquiggleJobResult {
  const { environment, ast, externals, sourceId } = job;

  const externalsValue = deserializeValue(externals);
  if (externalsValue.type !== "Dict") {
    throw new Error("Expected externals to be a dictionary");
  }

  const expressionResult = errMap(
    compileAst(ast, getStdLib().merge(externalsValue.value)),
    (e) => new SqCompileError(e)
  );

  if (!expressionResult.ok) {
    throw new Error(
      `Expected expression to be ok, got: ${expressionResult.value}`
    );
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

  return {
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
}

function postTypedMessage(data: SquiggleWorkerResponse) {
  postMessage(data);
}

addEventListener("message", (e) => {
  // TODO - validate e.data?
  try {
    const jobResult = processJob(e.data);
    postTypedMessage({
      type: "result",
      payload: { ok: true, value: jobResult },
    } satisfies SquiggleWorkerResponse);
  } catch (e: unknown) {
    postTypedMessage({
      type: "result",
      payload: { ok: false, value: String(e) },
    });
  }
});
