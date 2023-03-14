import { Choice } from "@/types";
import { result, SqDistributionError, SqLambda } from "@quri/squiggle-lang";
import {
  SqDistributionTag,
  SqSampleSetDistribution,
} from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import { useMemo } from "react";
import { Filter } from "../types";

export { useRelativeValues } from "./useRelativeValues";

export const useFilteredChoices = (choices: Choice[], filter: Filter) => {
  return useMemo(() => {
    return choices.filter((choice) =>
      choice.clusterId ? filter.selectedClusters.has(choice.clusterId) : true
    );
  }, [choices, filter]);
};

// TODO - rename?
export type CachedItem = {
  dist: SqSampleSetDistribution;
  median: result<number, SqDistributionError>;
  min: result<number, SqDistributionError>;
  max: result<number, SqDistributionError>;
  sortedSamples: number[];
};

type CachedItemResult = result<CachedItem, string>;

export type CachedPairs = {
  [k: string]: { [k: string]: CachedItemResult };
};

const buildCachedValue = ({
  fn,
  id1,
  id2,
}: {
  fn: SqLambda;
  id1: string;
  id2: string;
}): CachedItemResult => {
  const env = fn.location.project.getEnvironment();

  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const value = result.value;
  if (value.tag !== "Dist") {
    return { ok: false, value: "Expected dist" };
  }
  const dist = value.value;

  if (dist.tag !== SqDistributionTag.SampleSet) {
    // TODO - convert automatically?
    return { ok: false, value: "Expected sample set" };
  }

  const median = dist.inv(env, 0.5);
  const [min, max] = [0.05, 0.95].map((q) => dist.inv(env, q));

  const sortedSamples = [...dist.value().samples].sort((a, b) => a - b);

  return {
    ok: true,
    value: {
      dist,
      median,
      min,
      max,
      sortedSamples,
    },
  };
};

export const useCachedPairsToOneItem = (
  fn: SqLambda,
  choices: Choice[],
  id2: string
): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < choices.length; i++) {
      const id1 = choices[i].id;

      pairs[id1] ??= {};
      pairs[id1][id2] = buildCachedValue({ fn, id1, id2 });
    }
    return pairs;
  }, [fn, choices, id2]);
};

export const useCachedPairs = (
  fn: SqLambda,
  choices: Choice[]
): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < choices.length; i++) {
      // note: we could iterate up to `i` in half-grid mode
      for (let j = 0; j < choices.length; j++) {
        const id1 = choices[i].id;
        const id2 = choices[j].id;

        pairs[id1] ??= {};
        pairs[id1][id2] = buildCachedValue({ fn, id1, id2 });
      }
    }
    return pairs;
  }, [fn, choices]);
};
