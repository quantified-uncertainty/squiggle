import { Choice } from "@/types";
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

export {
  useCachedPairs,
  useCachedPairsToOneItem,
  type CachedItem,
  type CachedPairs,
} from "./cachedPairs";
