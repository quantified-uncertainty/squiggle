import { compileAst } from "../expression/compile.js";
import { AST, Env, SqCompileError } from "../index.js";
import { getStdLib } from "../library/index.js";
import { Reducer } from "../reducer/Reducer.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
} from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { errMap, result } from "../utility/result.js";
import { Value, vDict } from "../value/index.js";

export type SquiggleJob = {
  environment: Env;
  ast: AST;
  bundle: SquiggleBundle;
  externalsEntrypoint: SquiggleBundleEntrypoint<"value">;
  sourceId: string;
};

export type SquiggleJobResult = {
  bundle: SquiggleBundle;
  result: SquiggleBundleEntrypoint<"value">;
  bindings: SquiggleBundleEntrypoint<"value">;
  exports: SquiggleBundleEntrypoint<"value">;
};

export type SquiggleWorkerResponse = {
  type: "result";
  payload: result<SquiggleJobResult, string>;
};

function processJob(job: SquiggleJob): SquiggleJobResult {
  const { environment, ast, bundle, externalsEntrypoint, sourceId } = job;

  const externalsValue = squiggleCodec
    .makeDeserializer(bundle)
    .deserialize(externalsEntrypoint);

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

  const resultStore = squiggleCodec.makeSerializer();
  const resultEntrypoint = resultStore.serialize("value", result);
  const bindingsEntrypoint = resultStore.serialize("value", vDict(bindings));
  const exportsEntrypoint = resultStore.serialize(
    "value",
    vDict(exports).mergeTags({
      exportData: {
        sourceId,
        path: [],
      },
    })
  );
  resultStore.serialize("value", result);

  return {
    bundle: resultStore.getBundle(),
    result: resultEntrypoint,
    bindings: bindingsEntrypoint,
    exports: exportsEntrypoint,
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
