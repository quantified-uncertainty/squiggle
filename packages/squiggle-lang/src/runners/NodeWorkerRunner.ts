import Worker from "web-worker";

import { squiggleCodec } from "../serialization/squiggle.js";
import { Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { SquiggleJob, SquiggleWorkerResponse } from "./worker.js";

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
    } satisfies SquiggleJob);

    return new Promise<RunResult>((resolve) => {
      worker.addEventListener("message", (e: any) => {
        const data: SquiggleWorkerResponse = e.data;
        if (data.type !== "result")
          throw new Error("Expected result message from worker");

        worker.terminate();
        if (data.payload.ok) {
          console.log(JSON.stringify(data.payload.value.bundle, null, 2));
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
          throw new Error(String(data.payload.value)); // TODO
          // deserialize error and resolve(Err(...))
        }
      });
    });
  }
}
