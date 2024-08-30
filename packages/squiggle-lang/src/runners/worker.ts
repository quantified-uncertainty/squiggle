import { AST } from "../ast/types.js";
import { Env } from "../dists/env.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
} from "../serialization/squiggle.js";
import { baseRun } from "./common.js";
import { SerializedRunResult, serializeRunResult } from "./serialization.js";

export type SquiggleWorkerJob = {
  environment: Env;
  ast: AST;
  bundle: SquiggleBundle;
  externalsEntrypoint: SquiggleBundleEntrypoint<"value">;
};

export type SquiggleWorkerResponse =
  | {
      type: "result";
      payload: SerializedRunResult;
    }
  | {
      type: "internal-error";
      payload: string;
    };

function processJob(job: SquiggleWorkerJob): SerializedRunResult {
  const externals = squiggleCodec
    .makeDeserializer(job.bundle)
    .deserialize(job.externalsEntrypoint);

  if (externals.type !== "Dict") {
    throw new Error("Expected externals to be a dictionary");
  }

  const result = baseRun({
    ast: job.ast,
    environment: job.environment,
    externals,
  });

  return serializeRunResult(result);
}

function postTypedMessage(data: SquiggleWorkerResponse) {
  postMessage(data);
}

addEventListener("message", (e: MessageEvent<SquiggleWorkerJob>) => {
  try {
    const result = processJob(e.data);
    postTypedMessage({
      type: "result",
      payload: result,
    });
  } catch (e) {
    postTypedMessage({
      type: "internal-error",
      payload: e instanceof Error ? e.stack ?? String(e) : String(e),
    });
  }
});
