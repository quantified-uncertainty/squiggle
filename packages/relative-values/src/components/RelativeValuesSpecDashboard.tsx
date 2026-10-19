"use client";
import { FC, useEffect, useState } from "react";

import { Env, result } from "@quri/squiggle-lang";
import { RefreshIcon } from "@quri/ui";

import { RelativeValuesSpec } from "../spec/fromSqValue.js";
import { RelativeValuesCache } from "../values/cache.js";
import { ModelEvaluator } from "../values/ModelEvaluator.js";
import {
  RelativeValuesDashboard,
  RelativeValuesDashboardProps,
} from "./RelativeValuesDashboard.js";

export function useRelativeValuesEvaluator(
  spec: RelativeValuesSpec,
  options: {
    cache?: RelativeValuesCache;
    modelCode?: string;
    environment?: Env;
  } = {}
): result<ModelEvaluator, string> | undefined {
  const { cache, modelCode, environment } = options;
  const [evaluator, setEvaluator] = useState<
    result<ModelEvaluator, string> | undefined
  >();

  useEffect(() => {
    let cancelled = false;
    setEvaluator(undefined);
    ModelEvaluator.fromSpec(spec, { cache, modelCode, environment }).then(
      (result) => {
        if (!cancelled) {
          setEvaluator(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setEvaluator({ ok: false, value: String(error) });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [spec, cache, modelCode, environment]);

  return evaluator;
}

export type RelativeValuesSpecDashboardProps = Omit<
  RelativeValuesDashboardProps,
  "definition" | "evaluator"
> & {
  spec: RelativeValuesSpec;
  // Defaults to a fresh in-memory cache for each spec.
  cache?: RelativeValuesCache;
  // Squiggle source that defines the spec; enables per-pair Squiggle charts in
  // the list view sidebar (requires `spec.variableName`).
  modelCode?: string;
  environment?: Env;
};

/**
 * Dashboard for a spec parsed with `relativeValuesSpecFromSqValue` or found
 * with `findRelativeValuesExports`.
 */
export const RelativeValuesSpecDashboard: FC<
  RelativeValuesSpecDashboardProps
> = ({ spec, cache, modelCode, environment, ...dashboardProps }) => {
  const evaluator = useRelativeValuesEvaluator(spec, {
    cache,
    modelCode,
    environment,
  });

  if (!evaluator) {
    return <RefreshIcon className="animate-spin text-gray-400" />;
  }

  if (!evaluator.ok) {
    return <div className="text-sm text-red-700">{evaluator.value}</div>;
  }

  return (
    <RelativeValuesDashboard
      {...dashboardProps}
      definition={spec.definition}
      evaluator={evaluator.value}
    />
  );
};
