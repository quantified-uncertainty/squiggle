"use client";
import { useEffect, useMemo, useState } from "react";

import { RelativeValuesDefinition } from "../types.js";
import {
  ComputeProgress,
  ItemPair,
  ModelEvaluator,
} from "../values/ModelEvaluator.js";

/**
 * Which pairs a view needs: the list view only compares items within each
 * cluster and with the cluster's unit; other views need all n² pairs.
 */
export type ComputationScope = "list" | "all";

function allPairs(definition: RelativeValuesDefinition): ItemPair[] {
  const ids = definition.items.map((item) => item.id);
  return ids.flatMap((id1) => ids.map((id2): ItemPair => [id1, id2]));
}

// Mirrors what `ListView` compares: pairs within each cluster table (for
// uncertainty percentiles and sorting) and each item with the table's default
// unit.
function listViewPairs(definition: RelativeValuesDefinition): ItemPair[] {
  const { items, clusters } = definition;
  const clusterIds = new Set(clusters.map((cluster) => cluster.id));
  const itemIds = new Set(items.map((item) => item.id));
  const findUnit = (id: string | null | undefined) =>
    id && itemIds.has(id) ? id : undefined;
  const defaultUnit = findUnit(definition.recommendedUnit) ?? items[0]?.id;

  const groups = new Map<string | null, string[]>();
  for (const item of items) {
    const key =
      item.clusterId && clusterIds.has(item.clusterId) ? item.clusterId : null;
    groups.set(key, [...(groups.get(key) ?? []), item.id]);
  }

  const seen = new Set<string>();
  const pairs: ItemPair[] = [];
  const add = (id1: string, id2: string) => {
    const key = `${id1}\0${id2}`;
    if (!seen.has(key)) {
      seen.add(key);
      pairs.push([id1, id2]);
    }
  };
  for (const [clusterId, ids] of groups) {
    const unit =
      (clusterId === null
        ? undefined
        : findUnit(
            clusters.find((cluster) => cluster.id === clusterId)
              ?.recommendedUnit
          )) ?? defaultUnit;
    for (const id1 of ids) {
      if (unit !== undefined) {
        add(id1, unit);
      }
      for (const id2 of ids) {
        add(id1, id2);
      }
    }
  }
  return pairs;
}

// Identifies the set of pairs, ignoring titles, names and colors.
function structureKey(definition: RelativeValuesDefinition): string {
  return JSON.stringify([
    definition.items.map((item) => [item.id, item.clusterId ?? null]),
    definition.clusters.map((cluster) => [
      cluster.id,
      cluster.recommendedUnit ?? null,
    ]),
    definition.recommendedUnit ?? null,
  ]);
}

type Computed = {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  key: string;
  scope: ComputationScope;
};

const covers = (computed: Computed, scope: ComputationScope) =>
  computed.scope === "all" || computed.scope === scope;

/**
 * Computes the pairs that a view needs without blocking the UI (see
 * `ModelEvaluator.computePairs`), then the remaining pairs in the background.
 */
export function useRelativeValuesComputation({
  definition,
  evaluator,
  scope,
  enabled = true,
}: {
  definition: RelativeValuesDefinition;
  evaluator: ModelEvaluator;
  scope: ComputationScope;
  // If false, views compute pairs synchronously when they render.
  enabled?: boolean;
}): {
  ready:
    | { definition: RelativeValuesDefinition; evaluator: ModelEvaluator }
    | undefined;
  // Whether `ready` is an older definition or evaluator.
  isStale: boolean;
  // Set while computing; `background` means that the current view is ready
  // and the pairs for other views are being computed.
  progress: (ComputeProgress & { background: boolean }) | undefined;
  error: string | undefined;
} {
  const key = structureKey(definition);
  // `definition` might be a new object on every render (e.g. with different
  // cluster colors); pairs only depend on `key`.
  const currentPairs = useMemo(
    () => ({ key, list: listViewPairs(definition), all: allPairs(definition) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );
  const required = scope === "list" ? currentPairs.list : currentPairs.all;

  const isCached = useMemo(
    () => !enabled || !evaluator.canCompute || evaluator.isCached(required),
    [enabled, evaluator, required]
  );

  const [computed, setComputed] = useState<Computed | undefined>();
  const [progress, setProgress] = useState<
    (ComputeProgress & { background: boolean }) | undefined
  >();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (!enabled || !evaluator.canCompute) {
      setProgress(undefined);
      return;
    }
    const controller = new AbortController();
    const { signal } = controller;
    const run = async () => {
      setError(undefined);
      if (!evaluator.isCached(required)) {
        await evaluator.computePairs(required, {
          signal,
          onProgress: (p) => setProgress({ ...p, background: false }),
        });
      }
      setComputed({ definition, evaluator, key: currentPairs.key, scope });
      if (scope !== "all" && !evaluator.isCached(currentPairs.all)) {
        await evaluator.computePairs(currentPairs.all, {
          signal,
          onProgress: (p) => setProgress({ ...p, background: true }),
        });
        setComputed({
          definition,
          evaluator,
          key: currentPairs.key,
          scope: "all",
        });
      }
      setProgress(undefined);
    };
    run().catch((e: unknown) => {
      if (!signal.aborted) {
        setError(e instanceof Error ? e.message : String(e));
        setProgress(undefined);
      }
    });
    return () => controller.abort();
    // `definition` is omitted on purpose: `currentPairs` covers the parts that
    // affect computation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, evaluator, scope, currentPairs, required]);

  const currentIsComputed =
    isCached ||
    (computed !== undefined &&
      computed.evaluator === evaluator &&
      computed.key === key &&
      covers(computed, scope));

  if (currentIsComputed) {
    return {
      ready: { definition, evaluator },
      isStale: false,
      progress,
      error,
    };
  }
  if (computed && covers(computed, scope)) {
    return { ready: computed, isStale: true, progress, error };
  }
  return { ready: undefined, isStale: false, progress, error };
}
