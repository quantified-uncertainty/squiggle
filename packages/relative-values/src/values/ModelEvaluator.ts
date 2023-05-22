import { result, SqLambda, SqProject } from "@quri/squiggle-lang";
import { z } from "zod";

import { cartesianProduct } from "@/lib/utils";
import { getModelCode, Model } from "@/model/utils";
import { ModelCache, RelativeValue, RelativeValueResult } from "./types";

export const extractOkValues = <A, B>(items: result<A, B>[]): A[] => {
  return items
    .filter((item): item is { ok: true; value: A } => item.ok)
    .map((item) => item.value);
};

const getPercentile = (sortedList: number[], percentage: number): number => {
  const index = (percentage / 100) * sortedList.length;
  const result = sortedList[Math.floor(index)];
  return result;
};

export function getParamPercentiles(
  values: RelativeValue[],
  fn: (value: RelativeValue) => number,
  percentiles: [number, number],
  filter0 = false
): [number, number] {
  let list = values.map(fn).sort((a, b) => a - b);
  if (filter0) {
    list = list.filter((v) => v !== 0);
  }
  return [
    getPercentile(list, percentiles[0]),
    getPercentile(list, percentiles[1]),
  ];
}

function buildRelativeValue({
  fn,
  id1,
  id2,
}: {
  fn: SqLambda;
  id1: string;
  id2: string;
}): RelativeValueResult {
  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const record = result.value.asJS();
  if (!(record instanceof Map)) {
    return { ok: false, value: "Expected record" };
  }

  const rvSchema = z.object({
    median: z.number(),
    mean: z.number(),
    min: z.number(),
    max: z.number(),
    uncertainty: z.number(),
  });

  const itemResult = rvSchema.safeParse(Object.fromEntries(record.entries()));
  if (!itemResult.success) {
    return {
      ok: false,
      value: itemResult.error.message,
    };
  }

  return {
    ok: true,
    value: itemResult.data,
  };
}

export class ModelEvaluator {
  private constructor(
    public model: Model,
    private fn: SqLambda,
    private cache?: ModelCache
  ) {}

  static create(
    model: Model,
    cache?: ModelCache
  ): result<ModelEvaluator, string> {
    const project = SqProject.create();
    project.setSource("wrapper", "RelativeValues.wrap(fn)");
    project.setContinues("wrapper", ["model"]);
    project.setSource("model", getModelCode(model));

    project.run("wrapper");
    const result = project.getResult("wrapper");

    if (!result.ok || result.value.tag !== "Lambda") {
      if (!result.ok) {
        return {
          ok: false,
          value: `Failed to evaluate Squiggle code: ${result.value.toStringWithStackTrace()}`,
        };
      }

      if (result.value.tag !== "Lambda") {
        return {
          ok: false,
          value: `Expected a function as result, got: ${result.value.tag}`,
        };
      }
    }

    return {
      ok: true,
      value: new ModelEvaluator(model, result.value.value, cache),
    };
  }

  compareWithoutCache(id1: string, id2: string): RelativeValueResult {
    const relativeValue = buildRelativeValue({
      fn: this.fn,
      id1,
      id2,
    });

    return relativeValue;
  }

  compare(id1: string, id2: string): RelativeValueResult {
    const cachedValue = this.cache?.relativeValues[id1]?.[id2];
    if (!this.model.modified && cachedValue) {
      return cachedValue;
    }

    return this.compareWithoutCache(id1, id2);
  }

  compareAll(ids: string[]): RelativeValueResult[] {
    return cartesianProduct(ids, ids).map(([row, column]) =>
      this.compare(row, column)
    );
  }

  getParamPercentiles(
    ids: string[],
    fn: (value: RelativeValue) => number,
    percentiles: [number, number],
    filter0 = false
  ): [number, number] {
    return getParamPercentiles(
      extractOkValues(this.compareAll(ids)),
      fn,
      percentiles,
      filter0
    );
  }
}
