"use client";
import _ from "lodash";
import { useMemo } from "react";

import { makeSortContext, sortOptions } from "../../../state/select.js";
import { sortItems } from "../../../state/sort.js";
import { Item } from "../../../types.js";
import {
  extractOkValues,
  ModelEvaluator,
} from "../../../values/ModelEvaluator.js";
import { RelativeValue } from "../../../values/types.js";
import { hasInvalid } from "../../../values/value.js";
import { AxisConfig } from "../RelativeValuesProvider.js";

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

/**
 * Sorts items by an axis' sort settings; value sorts average over
 * `otherDimensionItems`. Computes pairs synchronously.
 */
export const useSortedItems = ({
  items,
  config,
  model,
  otherDimensionItems,
}: {
  items: readonly Item[];
  config: AxisConfig;
  model: ModelEvaluator;
  otherDimensionItems: readonly Item[]; // used for calculating average median and average uncertainty
}) => {
  return useMemo(() => {
    const context = makeSortContext({
      definition: { title: "", items: [...items], clusters: [] },
      sorts: undefined,
      lookup: (id1, id2) => model.compare(id1, id2),
      locale: undefined,
    });
    return sortItems(
      items,
      sortOptions(context, {
        sort: config.sort,
        defaultOrder: items,
        unit: undefined,
        metric: (item) => {
          const median = averageMedian({
            item,
            model,
            comparedTo: otherDimensionItems,
          });
          const uncertainty = averageUncertainty({
            item,
            model,
            comparedTo: otherDimensionItems,
          });
          return Number.isNaN(median) ? undefined : { median, uncertainty };
        },
      })
    );
  }, [items, config, model, otherDimensionItems]);
};
