import {
  deserializeIError,
  SerializedIError,
  serializeIError,
} from "../errors/IError.js";
import { compileAst } from "../expression/compile.js";
import { getStdLib } from "../library/index.js";
import { Reducer } from "../reducer/Reducer.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
} from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, Ok, result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { vDict, VDict } from "../value/VDict.js";
import { RunParams, RunResult } from "./BaseRunner.js";

export function baseRun(
  // `source` is not used, and we don't pass it to worker in WebWorkerRunner;
  // it's fine if some code passes the full `RunParams` here though.
  params: Omit<RunParams, "source">
): RunResult {
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
  const sourceId = params.ast.location.source;

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

  return Ok({
    result,
    bindings: vDict(bindings),
    exports: vDict(exports).mergeTags({
      exportData: {
        sourceId,
        path: [],
      },
    }),
  });
}

type SerializedRunOutput = {
  bundle: SquiggleBundle;
  result: SquiggleBundleEntrypoint<"value">;
  bindings: SquiggleBundleEntrypoint<"value">;
  exports: SquiggleBundleEntrypoint<"value">;
};

export type SerializedRunResult = result<SerializedRunOutput, SerializedIError>;

export function serializeRunResult(result: RunResult): SerializedRunResult {
  if (result.ok) {
    const resultStore = squiggleCodec.makeSerializer();
    const resultEntrypoint = resultStore.serialize(
      "value",
      result.value.result
    );
    const bindingsEntrypoint = resultStore.serialize(
      "value",
      result.value.bindings
    );
    const exportsEntrypoint = resultStore.serialize(
      "value",
      result.value.exports
    );

    return Ok({
      bundle: resultStore.getBundle(),
      result: resultEntrypoint,
      bindings: bindingsEntrypoint,
      exports: exportsEntrypoint,
    });
  } else {
    return Err(serializeIError(result.value));
  }
}

export function deserializeRunResult(
  serializedResult: SerializedRunResult
): RunResult {
  if (serializedResult.ok) {
    const deserializer = squiggleCodec.makeDeserializer(
      serializedResult.value.bundle
    );

    const result = deserializer.deserialize(serializedResult.value.result);
    const bindings = deserializer.deserialize(serializedResult.value.bindings);
    const exports = deserializer.deserialize(serializedResult.value.exports);

    if (!(bindings instanceof VDict)) {
      throw new Error("Expected VDict for bindings");
    }
    if (!(exports instanceof VDict)) {
      throw new Error("Expected VDict for exports");
    }

    return Ok({ result, bindings, exports });
  } else {
    const error = deserializeIError(serializedResult.value);
    return Err(error);
  }
}
