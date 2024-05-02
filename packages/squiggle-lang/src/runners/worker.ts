import { AST } from "../ast/parse.js";
import { Env } from "../dists/env.js";
import { SerializedIError, serializeIError } from "../errors/IError.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
} from "../serialization/squiggle.js";
import { Err, Ok, result } from "../utility/result.js";
import { baseRun } from "./common.js";

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

  const result = baseRun({
    ast: job.ast,
    sourceId: job.sourceId,
    environment: job.environment,
    externals: externalsValue,
  });
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
