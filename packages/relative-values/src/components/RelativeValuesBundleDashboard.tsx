"use client";
import { ReactElement, useMemo } from "react";

import {
  type LoadedRelativeValuesBundle,
  loadRelativeValuesBundle,
} from "../values/loadBundle.js";
import {
  RelativeValuesDashboardProps,
  renderDashboard,
} from "./RelativeValuesDashboard.js";

/**
 * Validate a bundle and build a cache-only evaluator for it. Memoized per
 * `bundle` object (across components).
 */
export function useRelativeValuesBundle(
  bundle: unknown
): LoadedRelativeValuesBundle {
  return useMemo(() => loadRelativeValuesBundle(bundle), [bundle]);
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
  ...props
}: RelativeValuesBundleDashboardProps<TabId>): ReactElement {
  return renderDashboard({ bundle }, props);
}
