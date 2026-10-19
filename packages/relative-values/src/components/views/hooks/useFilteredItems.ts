import { useMemo } from "react";

import { Item } from "../../../types.js";

import { AxisConfig } from "../RelativeValuesProvider.js";

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
