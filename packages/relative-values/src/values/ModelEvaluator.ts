import { result, sq, SqLambda, SqProject } from "@quri/squiggle-lang";

import { getModelCode, Model } from "@/model/utils";
import { jsonData, ModelCache } from "./cache";
import { RelativeValueResult } from "./types";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (SampleSet.map(dist, {|x| max([abs(x), 1e-9])}) -> log10 -> stdev)
  }
}
`;

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
    private cache: ModelCache
  ) {}

  static create(model: Model): result<ModelEvaluator, string> {
    const cache: ModelCache = jsonData
      .flatMap((r) => r.models)
      .find((r) => model && r.id == model.id) || {
      id: model.id,
      relativeValues: {},
    };

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
    const cachedValue = this.cache.relativeValues[id1]?.[id2];
    if (!this.model.modified && cachedValue) {
      return cachedValue;
    }

    return this.compareWithoutCache(id1, id2);
  }
}
