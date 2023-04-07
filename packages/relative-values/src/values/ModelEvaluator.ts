import { result, sq, SqLambda, SqProject } from "@quri/squiggle-lang";

import { getModelCode, Model } from "@/model/utils";
import { ModelCache, RelativeValue, RelativeValueResult } from "./types";

const wrapper = sq`
{|x, y|
  findUncertainty(dist) = {
    absDist = SampleSet.map(dist, abs)
    p5 = inv(absDist, 0.05)
    p95 = inv(absDist, 0.95)
    log10(p95 / p5)
  } 
  dists = fn(x,y)
  dist1 = dists[0] -> SampleSet.fromDist
  dist2 = dists[1] -> SampleSet.fromDist
  dist = dists[0] / dists[1]
  {
    median: inv(dist, 0.5),
    mean: mean(dist),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    uncertainty: findUncertainty(dist)
  }
}
`;

const cartesianProduct = <A, B>(a: A[], b: B[]): [A, B][] => {
  return a.flatMap((aItem) => b.map<[A, B]>((bItem) => [aItem, bItem]));
};

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

  const median = record.get("median");
  const mean = record.get("mean");
  const min = record.get("min");
  const max = record.get("max");
  const uncertainty = record.get("uncertainty");

  if (typeof median !== "number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  if (typeof mean !== "number") {
    return { ok: false, value: "Expected mean to be a number" };
  }
  if (typeof min !== "number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  if (typeof max !== "number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  if (typeof uncertainty !== "number") {
    return { ok: false, value: "Expected uncertainty to be a number" };
  }

  return {
    ok: true,
    value: {
      median,
      mean,
      min,
      max,
      uncertainty,
    },
  };
}

export class ModelEvaluator {
  private constructor(
    private model: Model, // unused for now
    private fn: SqLambda,
    private cache?: ModelCache
  ) {}

  static create(
    model: Model,
    cache?: ModelCache
  ): result<ModelEvaluator, string> {
    const project = SqProject.create();
    project.setSource("wrapper", wrapper);
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
    percentiles: number[],
    filter0 = false
  ): number[] {
    let list = extractOkValues(this.compareAll(ids))
      .map(fn)
      .sort((a, b) => a - b);
    if (filter0) {
      list = list.filter((v) => v !== 0);
    }
    return percentiles.map((p) => getPercentile(list, p));
  }
}
