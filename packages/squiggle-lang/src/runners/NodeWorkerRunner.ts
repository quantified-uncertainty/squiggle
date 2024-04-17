import Worker from "web-worker";

import { deserializeIError } from "../errors/IError.js";
import { squiggleCodec } from "../serialization/squiggle.js";
import { Err, Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

export class NodeWorkerRunner extends BaseRunner {
  async run({
    environment,
    ast,
    externals,
    sourceId,
  }: RunParams): Promise<RunResult> {
    const workerUrl = new URL("./worker.js", import.meta.url);
    const worker = new (Worker as any)(workerUrl, { type: "module" });

    const store = squiggleCodec.makeSerializer();
    const externalsEntrypoint = store.serialize("value", externals);
    const bundle = store.getBundle();

    worker.postMessage({
      environment,
      ast,
      bundle,
      externalsEntrypoint,
      sourceId,
    } satisfies SquiggleWorkerJob);

    return new Promise<RunResult>((resolve) => {
      worker.addEventListener("message", (e: any) => {
        const data: SquiggleWorkerResponse = e.data;
        if (data.type === "internal-error") {
          throw new Error(`Internal worker error: ${data.payload}`);
        }
        if (data.type !== "result") {
          throw new Error(
            `Unexpected message ${JSON.stringify(data)} from worker`
          );
        }

        worker.terminate();
        if (data.payload.ok) {
          const deserializer = squiggleCodec.makeDeserializer(
            data.payload.value.bundle
          );
          const result = deserializer.deserialize(data.payload.value.result);
          const bindings = deserializer.deserialize(
            data.payload.value.bindings
          );
          const exports = deserializer.deserialize(data.payload.value.exports);
          resolve(
            Ok({
              result,
              bindings: bindings as VDict,
              exports: exports as VDict,
              externals,
            })
          );
        } else {
          const error = deserializeIError(data.payload.value);
          resolve(Err(error));
        }
      });
    });
  }
}
