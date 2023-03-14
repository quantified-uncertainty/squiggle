import { Choice } from "@/types";
import { useMemo } from "react";
import { AxisConfig } from "../GridView/GridViewProvider";
import { CachedItem, CachedPairs } from "./cachedPairs";

export const useFilteredChoices = ({
  choices,
  config,
}: {
  choices: Choice[];
  config: AxisConfig;
}) => {
  return useMemo(() => {
    const filtered = choices.filter((choice) =>
      choice.clusterId
        ? config.filter.selectedClusters.has(choice.clusterId)
        : true
    );
    return filtered;
  }, [choices, config]);
};
