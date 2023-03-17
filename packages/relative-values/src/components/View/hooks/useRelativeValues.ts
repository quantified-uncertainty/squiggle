import { getModelCode, Model } from "@/model/utils";
import { sq, SqLambda, SqProject } from "@quri/squiggle-lang";
import { useMemo } from "react";

import { result } from "@quri/squiggle-lang";
import { SqSampleSetDistribution } from "@quri/squiggle-lang/dist/src/public/SqDistribution";

const wrapper = sq`
{|x, y|
  dist = fn(x, y) -> SampleSet.fromDist
  {
    dist: dist,
    median: inv(dist, 0.5),
    min: inv(dist, 0.05),
    max: inv(dist, 0.95),
    db: 10 * (dist -> log10 -> stdev)
  }
}
`;

export type RelativeValue = {
  dist: SqSampleSetDistribution;
  median: number;
  min: number;
  max: number;
  db: number;
  sortedSamples: number[];
};

export type RelativeValueResult = result<RelativeValue, string>;

const buildRelativeValue = ({
  fn,
  id1,
  id2,
}: {
  fn: SqLambda;
  id1: string;
  id2: string;
}): RelativeValueResult => {
  const env = fn.location.project.getEnvironment();

  const result = fn.call([id1, id2]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const value = result.value;
  if (value.tag !== "Record") {
    return { ok: false, value: "Expected dist" };
  }
  const record = value.value;

  const distValue = record.get("dist");
  const medianValue = record.get("median");
  const minValue = record.get("min");
  const maxValue = record.get("max");
  const dbValue = record.get("db");

  if (!distValue || distValue.tag !== "Dist") {
    return { ok: false, value: "Expected dist" };
  }

  const dist = distValue.value;
  if (dist.tag !== "SampleSet") {
    // TODO - convert automatically?
    return { ok: false, value: "Expected sample set" };
  }

  if (medianValue?.tag !== "Number") {
    return { ok: false, value: "Expected median to be a number" };
  }
  const median = medianValue.value;

  if (minValue?.tag !== "Number") {
    return { ok: false, value: "Expected min to be a number" };
  }
  const min = minValue.value;

  if (maxValue?.tag !== "Number") {
    return { ok: false, value: "Expected max to be a number" };
  }
  const max = maxValue.value;

  if (dbValue?.tag !== "Number") {
    return { ok: false, value: "Expected db to be a number" };
  }
  const db = dbValue.value;

  const sortedSamples = [...dist.value().samples].sort((a, b) => a - b);

  return {
    ok: true,
    value: {
      dist,
      median,
      min,
      max,
      db,
      sortedSamples,
    },
  };
};

export class RV {
  cache: Map<string, Map<string, RelativeValueResult>>;

  constructor(public fn: SqLambda) {
    this.cache = new Map();
  }

  compare(id1: string, id2: string) {
    const cachedValue = this.cache.get(id1)?.get(id2);
    if (cachedValue) {
      return cachedValue;
    }
    const value = buildRelativeValue({ id1, id2, fn: this.fn });
    if (!this.cache.get(id1)) {
      this.cache.set(id1, new Map());
    }
    this.cache.get(id1)!.set(id2, value);
    return value;
  }
}

export const useRelativeValues = (model: Model | undefined) => {
  const project = useMemo(() => {
    const project = SqProject.create();
    project.setSource("wrapper", wrapper);
    project.setContinues("wrapper", ["model"]);

    return project;
  }, []);

  const code = useMemo(() => {
    if (!model) {
      return undefined;
    }
    return getModelCode(model);
  }, [model]);

  const { rv, error } = useMemo(() => {
    if (code === undefined) {
      // no model selected
      return { error: "" };
    }

    project.setSource("model", code);
    project.run("wrapper");
    const result = project.getResult("wrapper");

    if (!result.ok) {
      return {
        error: `Failed to evaluate Squiggle code: ${result.value.toStringWithStackTrace()}`,
      };
    }

    if (result.value.tag !== "Lambda") {
      return {
        error: `Expected a function as result, got: ${result.value.tag}`,
      };
    }
    return {
      error: "",
      rv: new RV(result.value.value),
    };
  }, [project, code]);

  return { error, rv };
};
