import { Item } from "@/types";
import { result, SqLambda } from "@quri/squiggle-lang";
import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";
import { useMemo } from "react";

// TODO - rename?
export type CachedItem = {
  dist: SqSampleSetDistribution;
  median: number;
  min: number;
  max: number;
  db: number;
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
  if (value.tag !== "Record") {
    return { ok: false, value: "Expected dist" };
  }
  const record = value.value;

  const distValue = record.get("dist");
  const medianValue = record.get("median");
  const minValue = record.get("min");
  const maxValue = record.get("max");
  const dbValue = record.get("db");

  if (!distValue || distValue.tag !== "Dist") {
    return { ok: false, value: "Expected dist" };
  }

  const dist = distValue.value;
  if (dist.tag !== "SampleSet") {
    // TODO - convert automatically?
    return { ok: false, value: "Expected sample set" };
  }

  if (medianValue?.tag !== "Number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  const median = medianValue.value;

  if (minValue?.tag !== "Number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  const min = minValue.value;

  if (maxValue?.tag !== "Number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  const max = maxValue.value;

  if (dbValue?.tag !== "Number") {
    return { ok: false, value: "Expected db to be a number" };
  }
  const db = dbValue.value;

  const sortedSamples = [...dist.value().samples].sort((a, b) => a - b);

  return {
    ok: true,
    value: {
      dist,
      median,
      min,
      max,
      db,
      sortedSamples,
    },
  };
};

export const useCachedPairsToOneItem = (
  fn: SqLambda,
  items: Item[],
  id2: string
): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < items.length; i++) {
      const id1 = items[i].id;

      pairs[id1] ??= {};
      pairs[id1][id2] = buildCachedValue({ fn, id1, id2 });
    }
    return pairs;
  }, [fn, items, id2]);
};

export const useCachedPairs = (fn: SqLambda, items: Item[]): CachedPairs => {
  return useMemo(() => {
    const pairs: CachedPairs = {};

    for (let i = 0; i < items.length; i++) {
      // note: we could iterate up to `i` in half-grid mode
      for (let j = 0; j < items.length; j++) {
        const id1 = items[i].id;
        const id2 = items[j].id;

        pairs[id1] ??= {};
        pairs[id1][id2] = buildCachedValue({ fn, id1, id2 });
      }
    }
    return pairs;
  }, [fn, items]);
};
