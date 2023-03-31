import { Item } from "@/types";
import { RelativeValue } from "@/values/types";
import { ModelEvaluator } from "@/values/ModelEvaluator";
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
  return (
    comparedTo.reduce((total, item2) => {
      const value = model.compare(item.id, item2.id);
      if (!value.ok) {
        return total; // TODO: +Inf?
      }
      return total + getMetric(value.value);
    }, 0) / comparedTo.length
  );
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

export function averageDb({ item, comparedTo, model }: AverageProps) {
  return averageMetric({
    item,
    getMetric: (item) => item.db,
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
            averageDb({ item, model, comparedTo: otherDimensionChoices })
          );
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, model, otherDimensionChoices]);
};
