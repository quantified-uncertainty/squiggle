import {
  deserializeIError,
  SerializedIError,
  serializeIError,
} from "../errors/IError.js";
import { RunOutput } from "../reducer/Reducer.js";
import {
  SquiggleBundle,
  SquiggleBundleEntrypoint,
  squiggleCodec,
  SquiggleSerializationStore,
} from "../serialization/squiggle.js";
import { Err, Ok, result } from "../utility/result.js";
import { VDict } from "../value/VDict.js";
import { RunResult } from "./BaseRunner.js";

type SerializedRunOutputEntrypoints = {
  result: SquiggleBundleEntrypoint<"value">;
  bindings: SquiggleBundleEntrypoint<"value">;
  exports: SquiggleBundleEntrypoint<"value">;
  profile: SquiggleBundleEntrypoint<"profile"> | undefined;
};

type SerializedRunOutput = {
  bundle: SquiggleBundle;
  entrypoints: SerializedRunOutputEntrypoints;
};

export type SerializedRunResult = result<SerializedRunOutput, SerializedIError>;

export function serializeRunResult(result: RunResult): SerializedRunResult {
  if (result.ok) {
    const store = squiggleCodec.makeSerializer();

    return Ok({
      bundle: store.getBundle(),
      entrypoints: serializeRunOutputToStore(store, result.value),
    });
  } else {
    return Err(serializeIError(result.value));
  }
}

export function deserializeRunResult(
  serializedResult: SerializedRunResult
): RunResult {
  if (serializedResult.ok) {
    const { entrypoints, bundle } = serializedResult.value;

    return Ok(deserializeRunOutputFromBundle(bundle, entrypoints));
  } else {
    const error = deserializeIError(serializedResult.value);
    return Err(error);
  }
}

/*
 * These functions might seem convoluted, but they're very useful for
 * serializing multiple run outputs to a single bundle.
 *
 * Consider the following scenario: you have multiple interdependent Squiggle
 * files, and you want to store the output of all of them. You could run each
 * one separately and call `serializeRunResult`, but then you'd get multiple
 * JSON bundles that would contain duplicate data.
 *
 * So, instead, you could:
 * - create a serialization store
 * - call `serializeRunOutputToStore` multiple times
 * - gather all entrypoints in an object
 * - store the store and all entrypoints in a single file
 *
 * `deserializeRunOutputFromBundle` works in the opposite direction.
 */
export function serializeRunOutputToStore(
  store: SquiggleSerializationStore,
  runOutput: RunOutput
): SerializedRunOutputEntrypoints {
  const resultEntrypoint = store.serialize("value", runOutput.result);
  const bindingsEntrypoint = store.serialize("value", runOutput.bindings);
  const exportsEntrypoint = store.serialize("value", runOutput.exports);
  const profileEntrypoint = runOutput.profile
    ? store.serialize("profile", runOutput.profile)
    : undefined;

  return {
    result: resultEntrypoint,
    bindings: bindingsEntrypoint,
    exports: exportsEntrypoint,
    profile: profileEntrypoint,
  };
}

export function deserializeRunOutputFromBundle(
  bundle: SquiggleBundle,
  entrypoints: SerializedRunOutputEntrypoints
): RunOutput {
  const deserializer = squiggleCodec.makeDeserializer(bundle);

  const result = deserializer.deserialize(entrypoints.result);
  const bindings = deserializer.deserialize(entrypoints.bindings);
  const exports = deserializer.deserialize(entrypoints.exports);

  const profile = entrypoints.profile
    ? deserializer.deserialize(entrypoints.profile)
    : undefined;

  if (!(bindings instanceof VDict)) {
    throw new Error("Expected VDict for bindings");
  }
  if (!(exports instanceof VDict)) {
    throw new Error("Expected VDict for exports");
  }

  return { result, bindings, exports, profile };
}
