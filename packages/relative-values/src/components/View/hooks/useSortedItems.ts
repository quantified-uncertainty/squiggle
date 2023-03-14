import { Item } from "@/types";
import { useMemo } from "react";
import { AxisConfig } from "../ViewProvider";
import { CachedItem, CachedPairs } from "./cachedPairs";

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
    const averageMetric = (
      item: Item,
      getMetric: (item: CachedItem) => number
    ) => {
      return otherDimensionChoices.reduce((total, item2) => {
        const cachedValue = cache[item.id][item2.id];
        if (!cachedValue.ok) {
          return total; // TODO: +Inf?
        }
        return total + getMetric(cachedValue.value);
      }, 0);
    };

    const sorted = (() => {
      switch (config.sort.mode) {
        case "median": {
          const averageMedians = new Map<string, number>();
          for (const choice of items) {
            averageMedians.set(
              choice.id,
              averageMetric(choice, (item) => item.median)
            );
          }
          return items.sort((a, b) => {
            return (
              (averageMedians.get(a.id) || 0) - (averageMedians.get(b.id) || 0)
            );
          });
        }
        case "uncertainty": {
          const averageDbs = new Map<string, number>();
          for (const choice of items) {
            averageDbs.set(
              choice.id,
              averageMetric(choice, (item) => item.db)
            );
          }
          return items.sort((a, b) => {
            return (averageDbs.get(a.id) || 0) - (averageDbs.get(b.id) || 0);
          });
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, cache, otherDimensionChoices]);
};
