"use client";
import { useId, useMemo, useRef } from "react";

import { stableStringify } from "../state/resolve.js";
import { relativeValuesLookup } from "../state/select.js";
import type {
  RelativeValuesPairRequirement,
  RelativeValuesStateInput,
} from "../state/types.js";
import { emptyEvaluator, useCore, useProgress } from "./host/core.js";
import { usePresentation } from "./host/presentation.js";
import {
  allRequirementPairs,
  type ConsumerRequirement,
  requirementKey,
  type RequirementEntry,
} from "./host/requirements.js";
import type {
  RelativeValuesController,
  RelativeValuesProgress,
} from "./host/types.js";
import { useIsomorphicLayoutEffect } from "./host/useStateController.js";

const emptyDefinition = { title: "", items: [], clusters: [] };

/**
 * A consumer of the nearest provider: registers the pairs it needs, and
 * returns the controller (data, state, actions, status).
 */
export function useRelativeValuesConsumer(
  requirement: ConsumerRequirement,
  options: {
    overrides?: RelativeValuesStateInput<string>;
    // Built-in views don't re-render on progress updates.
    progress?: RelativeValuesProgress;
  } = {}
): RelativeValuesController<string> {
  const core = useCore();
  const { formatter, labels } = usePresentation();
  const consumerId = useId();
  const key = requirementKey(requirement, consumerId);
  const { overrides, progress } = options;
  const overridesKey = stableStringify(overrides ?? null);

  const entry = useRef<RequirementEntry>({ requirement, overrides });
  entry.current = { requirement, overrides };
  const { register, unregister } = core;
  useIsomorphicLayoutEffect(() => {
    register(consumerId, entry.current);
  }, [register, consumerId, key, overridesKey]);
  useIsomorphicLayoutEffect(
    () => () => unregister(consumerId),
    [unregister, consumerId]
  );

  const { selectWith, snapshot, asyncCompute } = core;
  const data = useMemo(
    () => (overrides ? selectWith(overrides) : core.data),
    // Overrides are compared by value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [core.data, selectWith, overridesKey]
  );

  const computed = useMemo(
    () =>
      !snapshot ||
      !asyncCompute ||
      snapshot.evaluator.isCached(
        allRequirementPairs(entry.current.requirement, data)
      ),
    // `key` identifies the requirement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot, asyncCompute, data, key]
  );

  const { status, error, actions, isStale } = core;
  return useMemo((): RelativeValuesController<string> => {
    const lookup = relativeValuesLookup(
      snapshot?.evaluator ?? emptyEvaluator(),
      asyncCompute ? "cached" : "sync"
    );
    const base = {
      ...data,
      actions,
      definition: snapshot?.definition ?? emptyDefinition,
      progress,
      isStale,
      format: formatter,
      labels,
      compare: lookup,
    };
    if (status === "error") {
      return {
        ...base,
        status: "error",
        evaluator: snapshot?.evaluator,
        error: error ?? "Error",
      };
    }
    if (!snapshot) {
      return {
        ...base,
        status: "loading",
        evaluator: undefined,
        error: undefined,
      };
    }
    return {
      ...base,
      status: computed ? "ready" : "computing",
      evaluator: snapshot.evaluator,
      error: undefined,
    };
  }, [
    data,
    actions,
    snapshot,
    progress,
    isStale,
    formatter,
    labels,
    asyncCompute,
    status,
    error,
    computed,
  ]);
}

/**
 * The data, state and actions of the nearest provider (a dashboard, a single
 * view, or `RelativeValuesProvider`), for custom views.
 *
 * - `requires` (default "unit"): the pairs that are computed before `status`
 *   is "ready": "none", "unit" (each item × the ranking unit), "items" (all
 *   pairs of the shown items), "all" (all pairs in scope), or a function.
 * - `overrides`: state for this consumer only (never written back), e.g. a
 *   "top 5" widget next to the full list.
 */
export function useRelativeValues<View extends string = string>(
  options: {
    requires?: RelativeValuesPairRequirement;
    overrides?: RelativeValuesStateInput<string>;
  } = {}
): RelativeValuesController<View> {
  const progress = useProgress();
  const requires = options.requires ?? "unit";
  const requirement = useMemo(
    (): ConsumerRequirement => ({ kind: "requires", requires }),
    [requires]
  );
  return useRelativeValuesConsumer(requirement, {
    overrides: options.overrides,
    progress,
  }) as unknown as RelativeValuesController<View>;
}
