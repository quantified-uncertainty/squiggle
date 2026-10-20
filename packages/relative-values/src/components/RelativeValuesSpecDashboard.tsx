"use client";
import { ReactElement } from "react";

import { Env, result } from "@quri/squiggle-lang";

import { RelativeValuesSpec } from "../spec/fromSqValue.js";
import { RelativeValuesCache } from "../values/cache.js";
import { ModelEvaluator } from "../values/ModelEvaluator.js";
import { useSpecEvaluator } from "./host/source.js";
import {
  RelativeValuesDashboardProps,
  renderDashboard,
} from "./RelativeValuesDashboard.js";

/**
 * Builds an evaluator for a spec; undefined while it's being built. Shared
 * per (spec, cache, modelCode, environment), so that several components on
 * one spec share one evaluator.
 */
export function useRelativeValuesEvaluator(
  spec: RelativeValuesSpec,
  options: {
    cache?: RelativeValuesCache;
    modelCode?: string;
    environment?: Env;
  } = {}
): result<ModelEvaluator, string> | undefined {
  return useSpecEvaluator(spec, options);
}

export type RelativeValuesSpecDashboardProps<TabId extends string = never> =
  Omit<RelativeValuesDashboardProps<TabId>, "definition" | "evaluator"> & {
    spec: RelativeValuesSpec;
    // Defaults to an in-memory cache, shared by components with the same
    // spec.
    cache?: RelativeValuesCache;
    // Squiggle source that defines the spec; enables per-pair Squiggle charts
    // in the list view sidebar (requires `spec.variableName`).
    modelCode?: string;
    environment?: Env;
  };

/**
 * Dashboard for a spec parsed with `relativeValuesSpecFromSqValue` or found
 * with `findRelativeValuesExports`.
 */
export function RelativeValuesSpecDashboard<TabId extends string = never>({
  spec,
  cache,
  modelCode,
  environment,
  ...props
}: RelativeValuesSpecDashboardProps<TabId>): ReactElement {
  return renderDashboard({ spec, cache, modelCode, environment }, props);
}
