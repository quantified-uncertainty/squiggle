import { Item } from "@/types";
import _ from "lodash";
import { useMemo } from "react";
import { AxisConfig } from "../ViewProvider";
import { CachedItem, CachedPairs } from "./cachedPairs";

const averageMetric = ({
  item,
  comparedTo,
  getMetric,
  cache,
}: {
  item: Item;
  comparedTo: Item[];
  getMetric: (item: CachedItem) => number;
  cache: CachedPairs;
}) => {
  return (
    comparedTo.reduce((total, item2) => {
      const cachedValue = cache[item.id][item2.id];
      if (!cachedValue.ok) {
        return total; // TODO: +Inf?
      }
      return total + getMetric(cachedValue.value);
    }, 0) / comparedTo.length
  );
};

type AverageProps = {
  item: Item;
  comparedTo: Item[];
  cache: CachedPairs;
};

export function averageMedian({ item, comparedTo, cache }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.median,
    comparedTo,
    cache,
  });
}

export function averageDb({ item, comparedTo, cache }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.db,
    comparedTo,
    cache,
  });
}

export const useSortedItems = ({
  items,
  config,
  cache,
  otherDimensionItems: otherDimensionChoices,
}: {
  items: Item[];
  config: AxisConfig;
  cache: CachedPairs;
  otherDimensionItems: Item[]; // used for calculating average median and average uncertainty
}) => {
  return useMemo(() => {
    const sorted = (() => {
      switch (config.sort.mode) {
        case "median": {
          return _.sortBy(items, (item) =>
            averageMedian({ item, cache, comparedTo: otherDimensionChoices })
          );
        }
        case "uncertainty": {
          return _.sortBy(items, (item) =>
            averageDb({ item, cache, comparedTo: otherDimensionChoices })
          );
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, cache, otherDimensionChoices]);
};
