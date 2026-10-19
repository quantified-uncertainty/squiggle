import type { Cluster, Item, RelativeValuesDefinition } from "../types.js";
import { type RelativeValuesScope, UNCLUSTERED } from "./types.js";

/** The definition's clusters by id. */
export function clusterMap(
  definition: RelativeValuesDefinition
): Map<string, Cluster> {
  return new Map(definition.clusters.map((cluster) => [cluster.id, cluster]));
}

/** The item's cluster, if it's a known cluster of the definition. */
export function clusterOf(
  item: Item,
  clusters: ReadonlyMap<string, Cluster>
): Cluster | undefined {
  return item.clusterId ? clusters.get(item.clusterId) : undefined;
}

/** The item's known cluster id, or UNCLUSTERED. */
export function tableKeyOf(
  item: Item,
  clusters: ReadonlyMap<string, Cluster>
): string {
  return clusterOf(item, clusters)?.id ?? UNCLUSTERED;
}

/**
 * Step 1 of the pipeline: definition ∩ scope, in definition order (or in
 * `scope.ids` order, if given).
 */
export function computeUniverse(
  definition: RelativeValuesDefinition,
  scope: RelativeValuesScope | undefined
): { items: Item[]; warnings: string[] } {
  const warnings: string[] = [];
  const clusters = clusterMap(definition);
  let items = definition.items;

  if (scope?.ids) {
    const byId = new Map(items.map((item) => [item.id, item]));
    const seen = new Set<string>();
    const unknown: string[] = [];
    const picked: Item[] = [];
    for (const id of scope.ids) {
      const item = byId.get(id);
      if (!item) {
        unknown.push(id);
      } else if (!seen.has(id)) {
        seen.add(id);
        picked.push(item);
      }
    }
    if (unknown.length) {
      warnings.push(
        `scope.ids: unknown item ids ignored: ${unknown.join(", ")}`
      );
    }
    items = picked;
  }

  if (scope?.clusters) {
    const unknown = scope.clusters.filter(
      (id): id is string => id !== null && !clusters.has(id)
    );
    if (unknown.length) {
      warnings.push(
        `scope.clusters: unknown cluster ids ignored: ${unknown.join(", ")}`
      );
    }
    const allowed = new Set<string | null>(scope.clusters);
    items = items.filter((item) =>
      allowed.has(clusterOf(item, clusters)?.id ?? null)
    );
  }

  if (scope?.exclude) {
    const excluded = new Set(scope.exclude);
    const known = new Set(definition.items.map((item) => item.id));
    const unknown = scope.exclude.filter((id) => !known.has(id));
    if (unknown.length) {
      warnings.push(
        `scope.exclude: unknown item ids ignored: ${unknown.join(", ")}`
      );
    }
    items = items.filter((item) => !excluded.has(item.id));
  }

  const where = scope?.where;
  if (where) {
    items = items.filter((item) => where(item, clusterOf(item, clusters)));
  }

  return { items, warnings };
}

/** Known clusters that have at least one item in `items`, in definition order. */
export function clustersIn(
  definition: RelativeValuesDefinition,
  items: readonly Item[]
): Cluster[] {
  const present = new Set(items.map((item) => item.clusterId));
  return definition.clusters.filter((cluster) => present.has(cluster.id));
}
