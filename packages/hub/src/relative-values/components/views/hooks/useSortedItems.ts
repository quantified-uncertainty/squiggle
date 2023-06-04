import _ from "lodash";
import { useMemo } from "react";

import { Item } from "@/relative-values/types";
import {
  ModelEvaluator,
  extractOkValues,
} from "@/relative-values/values/ModelEvaluator";
import { RelativeValue } from "@/relative-values/values/types";
import { hasInvalid } from "@/relative-values/values/value";
import { AxisConfig } from "../RelativeValuesProvider";

const averageMetric = ({
  item,
  comparedTo,
  getMetric,
  model,
}: {
  item: Item;
  comparedTo: readonly Item[];
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
  comparedTo: readonly Item[];
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

//Takes the first item, then appends the next item that has the lowest uncertainty with the last item
function organizeBySimilarity({
  items,
  model,
}: {
  items: readonly Item[];
  model: ModelEvaluator;
}): Item[] {
  let remaining = [...items];
  let first = remaining.shift();
  let sorted: Item[] = first ? [first] : [];

  while (remaining.length > 0) {
    // Keep iterating until all items are sorted
    let lastItem = _.last(sorted);

    if (!lastItem) break;

    let nextItem = _.minBy(remaining, (item) => {
      let result = model.compare((lastItem as Item).id, item.id);
      return result.ok ? result.value.uncertainty : 10000;
    });

    if (!nextItem) break;

    _.remove(remaining, (item) => item.id === (nextItem as Item).id);
    sorted.push(nextItem);
  }

  return sorted;
}

export const useSortedItems = ({
  items,
  config,
  model,
  otherDimensionItems: otherDimensionChoices,
}: {
  items: readonly Item[];
  config: AxisConfig;
  model: ModelEvaluator;
  otherDimensionItems: readonly Item[]; // used for calculating average median and average uncertainty
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
          return [...items];
      }
    })();

    return config.sort.desc ? sorted.reverse() : sorted;
  }, [items, config, model, otherDimensionChoices]);
};
