/* eslint-disable @typescript-eslint/no-explicit-any */
import jsonDiff from "json-diff";

import {
  deserializeRunResult,
  result,
  serializeRunResult,
  SqDict,
} from "@quri/squiggle-lang";

import { versionSupportsSqProjectV2 } from "./predicates.js";
import { squiggleLangByVersion } from "./versionedSquiggleLang.js";
import { SquiggleVersion } from "./versions.js";

type OriginalRunResult = Extract<
  ReturnType<typeof deserializeRunResult>,
  { ok: true }
>["value"];

type PatchedRunResult = {
  result: OriginalRunResult["result"];
  bindings: OriginalRunResult["bindings"];
};

type RunResult = result<PatchedRunResult, string>;

function reserialize(
  value: Extract<
    Parameters<typeof serializeRunResult>[0],
    { ok: true }
  >["value"]
): RunResult {
  const serialized = serializeRunResult({
    ok: true,
    value,
  });
  const result = deserializeRunResult(serialized);
  if (!result.ok) {
    return {
      ok: false,
      value: "Failed to deserialize result",
    };
  }
  return {
    ok: true,
    value: {
      result: result.value.result,
      bindings: result.value.bindings,
    },
  };
}

async function runVersion(
  version: SquiggleVersion,
  code: string
): Promise<RunResult> {
  if (versionSupportsSqProjectV2.plain(version)) {
    // modern SqProject
    const lang = await squiggleLangByVersion(version);
    const output = await lang.run(code);
    const outputResult = output.result;
    if (!outputResult.ok) {
      return {
        ok: false,
        value: "Failed to run code",
      };
    }
    const okResult = outputResult.value;
    return reserialize({
      result: okResult.result._value as any,
      bindings: okResult.bindings._value as any,
      exports: okResult.exports._value as any,
      profile: undefined,
    });
  } else {
    const lang = await squiggleLangByVersion(version);
    const output = await lang.run(code);
    if (!output.ok) {
      return {
        ok: false,
        value: "Failed to run code",
      };
    }
    const okResult = output.value;
    return reserialize({
      result: okResult.result._value as any,
      bindings: (okResult.bindings as any)._value,
      exports: SqDict.makeEmpty().asValue()._value,
      profile: undefined,
    });
  }
}

// Note: this function is not very reliable; but if it returns `undefined`, then "result" and "bindings" are _probably_ the same.
export async function compareVersions(params: {
  version1: SquiggleVersion;
  version2: SquiggleVersion;
  code: string;
}) {
  const result1 = await runVersion(params.version1, params.code);
  const result2 = await runVersion(params.version2, params.code);

  return jsonDiff.diff(result1, result2);
}
