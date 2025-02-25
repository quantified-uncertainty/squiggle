import { z } from "zod";

import {
  makeSelfContainedLinker,
  result,
  SqLambda,
  SqProject,
  SqStringValue,
} from "@quri/squiggle-lang";

import { RelativeValuesExportFullDTO } from "@/relative-values/data/fullExport";

import { cartesianProduct } from "../lib/utils";
import {
  RelativeValue,
  RelativeValueResult,
  RelativeValuesCacheRecord,
  relativeValueSchema,
} from "./types";

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
  const result = fn.call([
    SqStringValue.create(id1),
    SqStringValue.create(id2),
  ]);
  if (!result.ok) {
    return { ok: false, value: result.value.toString() };
  }
  const dict = result.value.asJS();

  if (!dict || typeof dict !== "object" || !("value" in dict)) {
    return { ok: false, value: "Expected dict with 'value'" };
  }

  const rvSchema = z.object({
    median: z.number(),
    mean: z.number(),
    min: z.number(),
    max: z.number(),
    uncertainty: z.number(),
  });

  const itemResult = rvSchema.safeParse(dict["value"]);
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
    public modelCode: string,
    public variableName: string,
    private fn: SqLambda,
    private cache?: RelativeValuesCacheRecord
  ) {}

  static async create(
    modelCode: string,
    variableName: string,
    cache?: RelativeValuesExportFullDTO["cache"]
  ): Promise<result<ModelEvaluator, string>> {
    // TODO - versioned-components
    // TODO - support hub imports
    const project = new SqProject({
      linker: makeSelfContainedLinker({
        wrapper: `
        import "model" as model
        RelativeValues.wrap(model.${variableName})
        `,
        model: modelCode,
      }),
    });
    await project.loadHead("wrapper", { moduleName: "wrapper" });

    const result = (await project.waitForOutput("wrapper")).getEndResult();

    if (!result.ok || result.value.tag !== "Lambda") {
      if (!result.ok) {
        return {
          ok: false,
          value: `Failed to evaluate Squiggle code: ${result.value.toStringWithDetails()}`,
        };
      }

      if (result.value.tag !== "Lambda") {
        return {
          ok: false,
          value: `Expected a function as result, got: ${result.value.tag}`,
        };
      }
    }

    let cacheRecord: RelativeValuesCacheRecord | undefined = {};
    if (cache) {
      cacheRecord = {};
      for (const item of cache) {
        cacheRecord[item.firstItem] ??= {};

        const result: RelativeValueResult =
          item.errorString === null
            ? {
                ok: true,
                value: relativeValueSchema.parse(JSON.parse(item.resultJSON)),
              }
            : {
                ok: false,
                value: item.errorString,
              };
        cacheRecord[item.firstItem][item.secondItem] = result;
      }
    }

    return {
      ok: true,
      value: new ModelEvaluator(
        modelCode,
        variableName,
        result.value.value,
        cacheRecord
      ),
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
    const cachedValue = this.cache?.[id1]?.[id2];
    if (cachedValue) {
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
