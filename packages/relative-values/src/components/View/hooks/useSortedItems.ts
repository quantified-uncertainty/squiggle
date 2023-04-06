import { Item } from "@/types";
import { RelativeValue } from "@/values/types";
import { hasInvalid } from "@/values/value";
import { ModelEvaluator, extractOkValues } from "@/values/ModelEvaluator";
import _ from "lodash";
import { useMemo } from "react";
import { AxisConfig } from "../ViewProvider";

const averageMetric = ({
  item,
  comparedTo,
  getMetric,
  model,
}: {
  item: Item;
  comparedTo: Item[];
  getMetric: (item: RelativeValue) => number;
  model: ModelEvaluator;
}) => {
  const comparisons = extractOkValues(
    comparedTo.map((item2) => model.compare(item.id, item2.id))
  )
    .filter((r) => !hasInvalid(r))
    .map(getMetric);

  if (comparisons.length === 0) {
    return NaN;
  } else {
    return _.mean(comparisons);
  }
};

type AverageProps = {
  item: Item;
  comparedTo: Item[];
  model: ModelEvaluator;
};

export function averageMedian({ item, comparedTo, model }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.median,
    comparedTo,
    model,
  });
}

export function averageUncertainty({ item, comparedTo, model }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.uncertainty,
    comparedTo,
    model,
  });
}

export const useSortedItems = ({
  items,
  config,
  model,
  otherDimensionItems: otherDimensionChoices,
}: {
  items: Item[];
  config: AxisConfig;
  model: ModelEvaluator;
  otherDimensionItems: Item[]; // used for calculating average median and average uncertainty
}) => {
  return useMemo(() => {
    const sorted = (() => {
      switch (config.sort.mode) {
        case "median": {
          return _.sortBy(items, (item) =>
            averageMedian({
              item,
              model: model,
              comparedTo: otherDimensionChoices,
            })
          );
        }
        case "uncertainty": {
          return _.sortBy(items, (item) =>
            averageUncertainty({
              item,
              model,
              comparedTo: otherDimensionChoices,
            })
          );
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, model, otherDimensionChoices]);
};
