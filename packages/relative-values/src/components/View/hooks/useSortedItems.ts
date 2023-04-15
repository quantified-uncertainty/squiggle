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

function organizeBySimilarity({
  items,
  model,
}: {
  items: Item[];
  model: ModelEvaluator;
}) {
  let remaining = [...items];
  let sorted = [remaining.shift()];

  while (remaining.length > 0) {
    // Keep iterating until all items are sorted
    let lastItem = _.last(sorted);
    if (!!lastItem) {
      let nextItem = _.minBy(remaining, (item) => {
        let result = model.compare(lastItem.id, item.id);
        return result.ok ? result.value.uncertainty : 10000;
      });
      if (!!nextItem) {
        _.remove(remaining, (item) => item.id === nextItem?.id);
        sorted.push(nextItem);
      }
    }
  }

  return sorted;
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
        case "similarity": {
          return organizeBySimilarity({ items, model });
        }
        default:
          return items;
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, model, otherDimensionChoices]);
};
