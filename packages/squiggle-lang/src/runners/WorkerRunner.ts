import Worker from "web-worker";

import { deserializeIError } from "../errors/IError.js";
import { squiggleCodec } from "../serialization/squiggle.js";
import { Err, Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { SquiggleWorkerJob, SquiggleWorkerResponse } from "./worker.js";

/**
 * This runner is, in theory, universal: it relies on https://www.npmjs.com/package/web-worker,
 * and so can run both in Node and in the browser.
 *
 * In practice, it's more complicated: loading the worker breaks webpack, so it
 * doesn't work in Next.js yet.
 */
export class WorkerRunner extends BaseRunner {
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

          if (!(bindings instanceof VDict)) {
            throw new Error("Expected VDict for bindings");
          }
          if (!(exports instanceof VDict)) {
            throw new Error("Expected VDict for exports");
          }

          resolve(Ok({ result, bindings, exports, externals }));
        } else {
          const error = deserializeIError(data.payload.value);
          resolve(Err(error));
        }
      });
    });
  }
}
