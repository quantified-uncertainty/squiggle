import { deserializeIError, serializeIError } from "../errors/IError.js";
import { squiggleCodec } from "../serialization/squiggle.js";
import { Err, Ok } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { BaseRunner, RunParams, RunResult } from "./BaseRunner.js";
import { EmbeddedRunner } from "./EmbeddedRunner.js";

/**
 * This runner is useful for testing serialization and deserialization.
 *
 *  It uses the EmbeddedRunner to run the code, and then serializes and
 *  deserializes the result before returning it.
 */
export class EmbeddedWithSerializationRunner extends BaseRunner {
  wrappedRunner = new EmbeddedRunner();

  async run(params: RunParams): Promise<RunResult> {
    const runnerResult = await this.wrappedRunner.run(params);
    if (runnerResult.ok) {
      const output = runnerResult.value;
      const serializer = squiggleCodec.makeSerializer();
      const resultEntrypoint = serializer.serialize("value", output.result);
      const bindingsEntrypoint = serializer.serialize("value", output.bindings);
      const exportsEntrypoint = serializer.serialize("value", output.exports);

      const deserializer = squiggleCodec.makeDeserializer(
        serializer.getBundle()
      );
      const result = deserializer.deserialize(resultEntrypoint);
      const bindings = deserializer.deserialize(bindingsEntrypoint);
      const exports = deserializer.deserialize(exportsEntrypoint);
      if (!(bindings instanceof VDict) || !(exports instanceof VDict)) {
        throw new Error("Deserialization failed");
      }

      return Ok({
        result,
        bindings,
        exports,
      });
    } else {
      return Err(deserializeIError(serializeIError(runnerResult.value)));
    }
  }
}
