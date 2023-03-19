import { SqLambda } from "@quri/squiggle-lang";

import { result } from "@quri/squiggle-lang";
import { RelativeValue } from "./RelativeValue";

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

  return {
    ok: true,
    value: new RelativeValue({
      dist,
      median,
      min,
      max,
      db,
    }),
  };
};

export class RVStorage {
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
