"use client";
import { useEffect, useMemo, useReducer } from "react";

import { Env, result } from "@quri/squiggle-lang";

import type { RelativeValuesSpec } from "../../spec/fromSqValue.js";
import type { RelativeValuesDefinition } from "../../types.js";
import type { RelativeValuesCache } from "../../values/cache.js";
import { loadRelativeValuesBundle } from "../../values/loadBundle.js";
import { ModelEvaluator } from "../../values/ModelEvaluator.js";

type SpecOptions = {
  cache?: RelativeValuesCache;
  modelCode?: string;
  environment?: Env;
};

type SpecEntry = SpecOptions & {
  promise: Promise<result<ModelEvaluator, string>>;
  result?: result<ModelEvaluator, string>;
};

// Evaluators per spec object and options, shared by all components, so that
// several dashboards on one spec share one evaluator (and its cache).
const specEvaluators = new WeakMap<RelativeValuesSpec, SpecEntry[]>();

function findSpecEntry(
  spec: RelativeValuesSpec,
  options: SpecOptions
): SpecEntry | undefined {
  return specEvaluators
    .get(spec)
    ?.find(
      (entry) =>
        entry.cache === options.cache &&
        entry.modelCode === options.modelCode &&
        entry.environment === options.environment
    );
}

function createSpecEntry(
  spec: RelativeValuesSpec,
  options: SpecOptions
): SpecEntry {
  const existing = findSpecEntry(spec, options);
  if (existing) {
    return existing;
  }
  const entry: SpecEntry = {
    ...options,
    promise: ModelEvaluator.fromSpec(spec, options).then(
      (result) => result,
      (error: unknown) => ({ ok: false, value: String(error) })
    ),
  };
  entry.promise.then((result) => {
    entry.result = result;
  });
  specEvaluators.set(spec, [...(specEvaluators.get(spec) ?? []), entry]);
  return entry;
}

/**
 * Builds an evaluator for a spec, asynchronously; undefined while it's being
 * built. Shared per (spec, cache, modelCode, environment).
 */
export function useSpecEvaluator(
  spec: RelativeValuesSpec | undefined,
  options: SpecOptions = {}
): result<ModelEvaluator, string> | undefined {
  const { cache, modelCode, environment } = options;
  const [, rerender] = useReducer((x: number) => x + 1, 0);
  // Look up during render; create in an effect (not on the server).
  const entry = spec
    ? findSpecEntry(spec, { cache, modelCode, environment })
    : undefined;

  useEffect(() => {
    if (!spec) {
      return;
    }
    const created = createSpecEntry(spec, { cache, modelCode, environment });
    if (created.result) {
      if (created !== entry) {
        rerender();
      }
      return;
    }
    let cancelled = false;
    created.promise.then(() => {
      if (!cancelled) {
        rerender();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [spec, cache, modelCode, environment, entry]);

  return entry?.result;
}

export type SourceProps = {
  definition?: RelativeValuesDefinition;
  evaluator?: ModelEvaluator;
  bundle?: unknown;
  spec?: RelativeValuesSpec;
  modelCode?: string;
  cache?: RelativeValuesCache;
  environment?: Env;
};

export type LoadedSource =
  | { status: "loading"; definition?: undefined; evaluator?: undefined }
  | {
      status: "error";
      error: string;
      definition?: undefined;
      evaluator?: undefined;
    }
  | {
      status: "ready";
      definition: RelativeValuesDefinition;
      evaluator: ModelEvaluator;
    };

/** Loads `definition` + `evaluator`, a `bundle` or a `spec`. */
export function useRelativeValuesSource(props: SourceProps): LoadedSource {
  const hasExplicit =
    props.definition !== undefined && props.evaluator !== undefined;
  const hasSpec = !hasExplicit && props.spec !== undefined;
  const hasBundle = !hasExplicit && !hasSpec && "bundle" in props;

  const bundle = useMemo(
    () => (hasBundle ? loadRelativeValuesBundle(props.bundle) : undefined),
    [hasBundle, props.bundle]
  );
  const specEvaluator = useSpecEvaluator(hasSpec ? props.spec : undefined, {
    cache: props.cache,
    modelCode: props.modelCode,
    environment: props.environment,
  });

  if (hasExplicit && props.definition && props.evaluator) {
    return {
      status: "ready",
      definition: props.definition,
      evaluator: props.evaluator,
    };
  }
  if (hasSpec && props.spec) {
    if (!specEvaluator) {
      return { status: "loading" };
    }
    return specEvaluator.ok
      ? {
          status: "ready",
          definition: props.spec.definition,
          evaluator: specEvaluator.value,
        }
      : { status: "error", error: specEvaluator.value };
  }
  if (bundle) {
    return bundle.ok
      ? {
          status: "ready",
          definition: bundle.value.definition,
          evaluator: bundle.value.evaluator,
        }
      : { status: "error", error: bundle.value };
  }
  return {
    status: "error",
    error:
      "No relative values source: pass `definition` and `evaluator`, `bundle` or `spec`",
  };
}
