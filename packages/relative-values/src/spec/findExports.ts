import {
  Env,
  result,
  run,
  SqDict,
  SqLinker,
  SqModuleOutput,
  SqValue,
} from "@quri/squiggle-lang";

import {
  looksLikeRelativeValuesSpec,
  RelativeValuesSpec,
  relativeValuesSpecFromSqValue,
} from "./fromSqValue.js";

export type RelativeValuesExport = {
  // Variable name
  name: string;
  value: SqValue;
  // Parsed spec, or an error message if the value looks like a spec but is invalid.
  spec: result<RelativeValuesSpec, string>;
};

/**
 * Find all top-level variables that look like relative values specs.
 *
 * Accepts a module output (all top-level bindings are checked, exported or
 * not) or a dict of values (e.g. `output.getExports()`).
 */
export function findRelativeValuesExports(
  source: SqModuleOutput | SqDict
): RelativeValuesExport[] {
  let dict: SqDict;
  // duck typing instead of `instanceof`, in case of multiple squiggle-lang copies
  if ("getBindings" in source) {
    const bindings = source.getBindings();
    if (!bindings.ok) {
      return [];
    }
    dict = bindings.value;
  } else {
    dict = source;
  }

  const result: RelativeValuesExport[] = [];
  for (const [name, value] of dict.entries()) {
    if (!looksLikeRelativeValuesSpec(value)) {
      continue;
    }
    result.push({
      name,
      value,
      spec: relativeValuesSpecFromSqValue(value, { variableName: name }),
    });
  }
  return result;
}

/**
 * Evaluate Squiggle code and parse the spec from the given variable.
 */
export async function relativeValuesSpecFromCode(
  code: string,
  variableName: string,
  options: { linker?: SqLinker; environment?: Env } = {}
): Promise<result<RelativeValuesSpec, string>> {
  const output = await run(code, options);
  const bindings = output.getBindings();
  if (!bindings.ok) {
    return {
      ok: false,
      value: `Failed to evaluate Squiggle code: ${bindings.value.toStringWithDetails()}`,
    };
  }
  const value = bindings.value.get(variableName);
  if (!value) {
    return { ok: false, value: `Variable ${variableName} not found` };
  }
  return relativeValuesSpecFromSqValue(value, { variableName });
}
