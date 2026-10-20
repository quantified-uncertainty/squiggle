import { result } from "@quri/squiggle-lang";

import type { RelativeValuesDefinition } from "../types.js";
import { parseRelativeValuesBundle, RelativeValuesBundle } from "./bundle.js";
import { ModelEvaluator } from "./ModelEvaluator.js";

export type LoadedRelativeValuesBundle = result<
  {
    bundle: RelativeValuesBundle;
    definition: RelativeValuesDefinition;
    evaluator: ModelEvaluator;
  },
  string
>;

const loaded = new WeakMap<object, LoadedRelativeValuesBundle>();

function load(bundle: unknown): LoadedRelativeValuesBundle {
  const parsed = parseRelativeValuesBundle(bundle);
  if (!parsed.ok) {
    return parsed;
  }
  return {
    ok: true,
    value: {
      bundle: parsed.value,
      definition: parsed.value.definition,
      evaluator: ModelEvaluator.fromBundle(parsed.value),
    },
  };
}

/**
 * Validates a bundle and builds a cache-only evaluator for it. Memoized per
 * bundle object, so that several dashboards on the same bundle share one parse
 * and one cache.
 */
export function loadRelativeValuesBundle(
  bundle: unknown
): LoadedRelativeValuesBundle {
  if (typeof bundle !== "object" || bundle === null) {
    return load(bundle);
  }
  let result = loaded.get(bundle);
  if (!result) {
    result = load(bundle);
    loaded.set(bundle, result);
  }
  return result;
}
