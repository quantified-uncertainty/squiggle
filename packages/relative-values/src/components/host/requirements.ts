import {
  autoPlotReference,
  gridPairs,
  listPairs,
  PairSet,
  plotPairs,
  rankingPairs,
  requiredRelativeValuesPairs,
} from "../../state/pairs.js";
import type {
  RelativeValuesData,
  RelativeValuesPairRequirement,
  RelativeValuesStateInput,
} from "../../state/types.js";
import type { ItemPair } from "../../values/ModelEvaluator.js";

/** The pairs that a mounted consumer (view, hook, custom tab) needs. */
export type ConsumerRequirement =
  | { kind: "requires"; requires: RelativeValuesPairRequirement }
  | { kind: "list"; groupByCluster: boolean }
  | { kind: "grid" }
  | {
      kind: "plot";
      similarity: boolean;
      // Items of the value / uncertainty plot are compared with these; null:
      // no value / uncertainty plot.
      reference: "auto" | "unit" | "average" | null;
    }
  | { kind: "pairs"; pairs: readonly ItemPair[] };

export type RequirementEntry = {
  requirement: ConsumerRequirement;
  // State overrides of a `useRelativeValues({ overrides })` consumer.
  overrides: RelativeValuesStateInput<string> | undefined;
};

/** Identifies a requirement; `id` stands in for functions. */
export function requirementKey(
  requirement: ConsumerRequirement,
  id: string
): string {
  switch (requirement.kind) {
    case "requires":
      return typeof requirement.requires === "function"
        ? `fn:${id}`
        : requirement.requires;
    case "list":
      return `list:${requirement.groupByCluster}`;
    case "grid":
      return "grid";
    case "plot":
      return `plot:${requirement.similarity}:${requirement.reference}`;
    case "pairs":
      return `pairs:${JSON.stringify(requirement.pairs)}`;
  }
}

/**
 * Pairs for a requirement: `ranking` (read by the pipeline itself, so
 * computed first) and the rest.
 */
export function requirementPairs(
  requirement: ConsumerRequirement,
  data: RelativeValuesData
): { ranking: ItemPair[]; pairs: ItemPair[] } {
  switch (requirement.kind) {
    case "requires":
      if (requirement.requires === "none") {
        return { ranking: [], pairs: [] };
      }
      return {
        ranking: rankingPairs(data),
        pairs: requiredRelativeValuesPairs(data, requirement.requires),
      };
    case "list":
      return {
        ranking: rankingPairs(data),
        pairs: listPairs(data, { groupByCluster: requirement.groupByCluster }),
      };
    case "grid":
      return {
        ranking: rankingPairs(data, { columns: true }),
        pairs: gridPairs(data),
      };
    case "plot": {
      const reference =
        requirement.reference === null
          ? undefined
          : requirement.reference === "unit"
            ? data.unit
              ? [data.unit]
              : []
            : requirement.reference === "average"
              ? data.universe
              : autoPlotReference(data);
      return {
        ranking: rankingPairs(data),
        pairs: plotPairs(data, {
          similarity: requirement.similarity,
          reference,
        }),
      };
    }
    case "pairs":
      return { ranking: [], pairs: [...requirement.pairs] };
  }
}

export function allRequirementPairs(
  requirement: ConsumerRequirement,
  data: RelativeValuesData
): ItemPair[] {
  const { ranking, pairs } = requirementPairs(requirement, data);
  const set = new PairSet();
  set.addAll(ranking);
  set.addAll(pairs);
  return set.pairs;
}
