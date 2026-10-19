"use client";
import { ReactElement, useMemo } from "react";

import { result } from "@quri/squiggle-lang";

import { RelativeValuesDefinition } from "../types.js";
import {
  parseRelativeValuesBundle,
  RelativeValuesBundle,
} from "../values/bundle.js";
import { ModelEvaluator } from "../values/ModelEvaluator.js";
import {
  RelativeValuesDashboard,
  RelativeValuesDashboardProps,
} from "./RelativeValuesDashboard.js";
import { RelativeValuesRoot } from "./RelativeValuesRoot.js";

/**
 * Validate a bundle and build a cache-only evaluator for it. Memoized by the
 * `bundle` object.
 */
export function useRelativeValuesBundle(bundle: unknown): result<
  {
    bundle: RelativeValuesBundle;
    definition: RelativeValuesDefinition;
    evaluator: ModelEvaluator;
  },
  string
> {
  return useMemo(() => {
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
  }, [bundle]);
}

export type RelativeValuesBundleDashboardProps<TabId extends string = never> =
  Omit<RelativeValuesDashboardProps<TabId>, "definition" | "evaluator"> & {
    // A bundle created by `squiggle-rv bundle` or `createRelativeValuesBundle`,
    // e.g. the result of `JSON.parse` or a JSON import. It's validated; errors
    // are shown instead of the dashboard.
    bundle: unknown;
  };

/**
 * Dashboard for precomputed relative values; doesn't run any Squiggle code.
 *
 * The list view sidebar shows summary numbers, but no distribution charts.
 */
export function RelativeValuesBundleDashboard<TabId extends string = never>({
  bundle,
  ...dashboardProps
}: RelativeValuesBundleDashboardProps<TabId>): ReactElement {
  const loaded = useRelativeValuesBundle(bundle);

  if (!loaded.ok) {
    return (
      <RelativeValuesRoot className={dashboardProps.className}>
        <pre className="whitespace-pre-wrap text-sm text-red-700">
          {loaded.value}
        </pre>
      </RelativeValuesRoot>
    );
  }

  return (
    <RelativeValuesDashboard
      {...dashboardProps}
      definition={loaded.value.definition}
      evaluator={loaded.value.evaluator}
    />
  );
}
