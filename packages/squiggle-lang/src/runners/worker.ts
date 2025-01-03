import { Env } from "../dists/env.js";
import { SqModule } from "../public/SqProject/SqModule.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
} from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { baseRun } from "./common.js";
import { SerializedRunResult, serializeRunResult } from "./serialization.js";

export type SquiggleWorkerJob = {
  module: {
    name: string;
    code: string;
  };
  environment: Env;
  bundle: SquiggleBundle;
  imports: Record<string, SquiggleBundleEntrypoint<"value">>;
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
  const imports: Record<string, Value> = {};
  const deserializer = squiggleCodec.makeDeserializer(job.bundle);
  for (const [path, entrypoint] of Object.entries(job.imports)) {
    imports[path] = deserializer.deserialize(entrypoint);
  }

  const module = new SqModule({
    name: job.module.name,
    code: job.module.code,
    // no pins, but that's fine
  });

  const result = baseRun({
    module,
    environment: job.environment,
    imports,
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
      payload: e instanceof Error ? (e.stack ?? String(e)) : String(e),
    });
  }
});
