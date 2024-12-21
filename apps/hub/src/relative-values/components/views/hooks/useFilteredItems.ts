import { useMemo } from "react";

import { Item } from "@/relative-values/types";

import { AxisConfig } from "../RelativeValuesProvider";

export const useFilteredItems = ({
  items,
  config,
}: {
  items: Item[];
  config: AxisConfig;
}) => {
  return useMemo(() => {
    const filtered = items.filter((item) =>
      item.clusterId ? config.filter.selectedClusters.has(item.clusterId) : true
    );
    return filtered;
  }, [items, config]);
};
