import { Choice } from "@/types";
import { useMemo } from "react";
import { AxisConfig } from "../GridView/GridViewProvider";
import { CachedItem, CachedPairs } from "./cachedPairs";

export {
  useCachedPairs,
  useCachedPairsToOneItem,
  type CachedItem,
  type CachedPairs
} from "./cachedPairs";
export { useRelativeValues } from "./useRelativeValues";

export const useFilteredChoices = ({ choices, config, cache }: {choices: Choice[], config: AxisConfig; cache: CachedPairs }) => {
  return useMemo(() => {
    const filtered = choices.filter((choice) =>
      choice.clusterId
        ? config.filter.selectedClusters.has(choice.clusterId)
        : true
    );

    const averageMetric = (item: Choice, getMetric: (item: CachedItem) => number) => {
              return choices.reduce((total, item2) => {
                const cachedValue = cache[item.id][item2.id];
                if (!cachedValue.ok) {
                  return total; // TODO: +Inf?
                }
                return total + getMetric(cachedValue.value)
              }, 0);
    };

    const sorted = (() => {
      switch (config.sort.mode) {
        case "median": {
          const averageMedians = new Map<string, number>();
          for (const choice of choices) {
            averageMedians.set(choice.id, averageMetric(choice, item => item.median));
          }
          return filtered.sort((a,b) => {
            return (averageMedians.get(a.id) || 0) - (averageMedians.get(b.id) || 0);
          });
        }
        case "uncertainty": {
          const averageDbs = new Map<string, number>();
          for (const choice of choices) {
            averageDbs.set(choice.id, averageMetric(choice, item => item.db));
          }
          return filtered.sort((a,b) => {
            return (averageDbs.get(a.id) || 0) - (averageDbs.get(b.id) || 0);
          });
        }
        default:
          return filtered;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [choices, config]);
};


