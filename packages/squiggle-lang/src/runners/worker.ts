import { AST } from "../ast/parse.js";
import { Env } from "../dists/env.js";
import { SerializedIError, serializeIError } from "../errors/IError.js";
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
import { Value, vDict } from "../value/index.js";

export type SquiggleWorkerJob = {
  environment: Env;
  ast: AST;
  bundle: SquiggleBundle;
  externalsEntrypoint: SquiggleBundleEntrypoint<"value">;
  sourceId: string;
};

export type SquiggleWorkerOutput = {
  bundle: SquiggleBundle;
  result: SquiggleBundleEntrypoint<"value">;
  bindings: SquiggleBundleEntrypoint<"value">;
  exports: SquiggleBundleEntrypoint<"value">;
};

export type SquiggleWorkerResult = result<
  SquiggleWorkerOutput,
  SerializedIError
>;

export type SquiggleWorkerResponse =
  | {
      type: "result";
      payload: SquiggleWorkerResult;
    }
  | {
      type: "internal-error";
      payload: string;
    };

function processJob(job: SquiggleWorkerJob): SquiggleWorkerResult {
  const externalsValue = squiggleCodec
    .makeDeserializer(job.bundle)
    .deserialize(job.externalsEntrypoint);

  if (externalsValue.type !== "Dict") {
    throw new Error("Expected externals to be a dictionary");
  }

  const expressionResult = compileAst(
    job.ast,
    getStdLib().merge(externalsValue.value)
  );

  if (!expressionResult.ok) {
    return Err(serializeIError(expressionResult.value));
  }
  const expression = expressionResult.value;

  if (expression.kind !== "Program") {
    // mostly for TypeScript, so that we could access `expression.value.exports`
    throw new Error("Expected Program expression");
  }

  const reducer = new Reducer(job.environment);
  let result: Value;
  try {
    result = reducer.evaluate(expression);
  } catch (e: unknown) {
    return Err(serializeIError(reducer.errorFromException(e)));
  }

  const exportNames = new Set(expression.value.exports);
  const bindings = ImmutableMap<string, Value>(
    Object.entries(expression.value.bindings).map(([name, offset]) => {
      let value = reducer.stack.get(offset);
      if (exportNames.has(name)) {
        value = value.mergeTags({
          exportData: {
            sourceId: job.sourceId,
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

  const resultStore = squiggleCodec.makeSerializer();
  const resultEntrypoint = resultStore.serialize("value", result);
  const bindingsEntrypoint = resultStore.serialize("value", vDict(bindings));
  const exportsEntrypoint = resultStore.serialize(
    "value",
    vDict(exports).mergeTags({
      exportData: {
        sourceId: job.sourceId,
        path: [],
      },
    })
  );
  resultStore.serialize("value", result);

  return Ok({
    bundle: resultStore.getBundle(),
    result: resultEntrypoint,
    bindings: bindingsEntrypoint,
    exports: exportsEntrypoint,
  });
}

function postTypedMessage(data: SquiggleWorkerResponse) {
  postMessage(data);
}

addEventListener("message", (e) => {
  // TODO - validate e.data?
  try {
    postTypedMessage({
      type: "result",
      payload: processJob(e.data),
    } satisfies SquiggleWorkerResponse);
  } catch (e: unknown) {
    postTypedMessage({
      type: "internal-error",
      payload: String(e),
    });
  }
});
