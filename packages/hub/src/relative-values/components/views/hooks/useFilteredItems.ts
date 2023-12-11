import { useMemo } from "react";

import { AxisConfig } from "../RelativeValuesProvider";

import { RelativeValuesDefinitionRevision$data } from "@/__generated__/RelativeValuesDefinitionRevision.graphql";

export const useFilteredItems = ({
  items,
  config,
}: {
  items: RelativeValuesDefinitionRevision$data["items"];
  config: AxisConfig;
}) => {
  return useMemo(() => {
    const filtered = items.filter((item) =>
      item.clusterId ? config.filter.selectedClusters.has(item.clusterId) : true
    );
    return filtered;
  }, [items, config]);
};
