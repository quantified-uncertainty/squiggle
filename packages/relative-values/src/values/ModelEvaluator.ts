import { result, sq, SqLambda, SqProject } from "@quri/squiggle-lang";

import { getModelCode, Model } from "@/model/utils";
import { ModelCache, RelativeValue, RelativeValueResult } from "./types";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  findDb(dist) = {
    p5 = abs(inv(dist, .95))
    p95 = abs(inv(dist, 0.05))
    diff = (p95 > p5) ? (p95 / p5) : (p5/p95)
    abs(log10(diff))
  } 
  {
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: findDb(dist)
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

const getPercentile = (sortedList: number[], percentile: number): number => {
  const index = (percentile / 100) * sortedList.length;
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
  const min = record.get("min");
  const max = record.get("max");
  const db = record.get("db");

  if (typeof median !== "number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  if (typeof min !== "number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  if (typeof max !== "number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  if (typeof db !== "number") {
    return { ok: false, value: "Expected db to be a number" };
  }

  return {
    ok: true,
    value: {
      median,
      min,
      max,
      db,
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
    percentiles: number[]
  ): number[] {
    let list = extractOkValues(this.compareAll(ids))
      .map(fn)
      .sort((a, b) => a - b);
    return percentiles.map((p) => getPercentile(list, p));
  }
}
