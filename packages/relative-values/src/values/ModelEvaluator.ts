import {
  defaultEnvironment,
  Env,
  result,
  run,
  SqLambda,
  SqLambdaValue,
  SqLinker,
  SqStringValue,
  SqValue,
} from "@quri/squiggle-lang";

import { cartesianProduct } from "../lib/utils.js";
import {
  RelativeValuesSpec,
  relativeValuesSpecFromSqValue,
} from "../spec/fromSqValue.js";
import {
  InMemoryRelativeValuesCache,
  makePairKey,
  RelativeValuesCache,
} from "./cache.js";
import {
  RelativeValue,
  RelativeValueResult,
  relativeValueSchema,
} from "./types.js";

export const extractOkValues = <A, B>(items: result<A, B>[]): A[] => {
  return items
    .filter((item): item is { ok: true; value: A } => item.ok)
    .map((item) => item.value);
};

const getPercentile = (sortedList: number[], percentage: number): number => {
  const index = (percentage / 100) * sortedList.length;
  return sortedList[Math.min(Math.floor(index), sortedList.length - 1)];
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

function errorToString(error: { toString(): string }): string {
  return error.toString();
}

function parseRelativeValue(value: SqValue): RelativeValueResult {
  if (value.tag !== "Dict") {
    return { ok: false, value: `Expected a dict, got ${value.tag}` };
  }
  const dict = value.value;
  const fields: Record<string, number | undefined> = {};
  for (const key of ["median", "mean", "min", "max", "uncertainty"]) {
    const field = dict.get(key);
    fields[key] = field?.tag === "Number" ? field.value : undefined;
  }

  const parsed = relativeValueSchema.safeParse(fields);
  if (!parsed.success) {
    return { ok: false, value: parsed.error.message };
  }
  return { ok: true, value: parsed.data };
}

// Lazily evaluated Squiggle helpers.
const helpersCode = `
export pairFromValues(values) = {|a, b| [values[a], values[b]]}
`;

let helpersPromise: Promise<{ pairFromValues: SqLambda }> | undefined;

async function getHelpers() {
  helpersPromise ??= (async () => {
    const output = await run(helpersCode);
    const bindings = output.getBindings();
    if (!bindings.ok) {
      throw new Error(
        `Failed to build relative values helpers: ${bindings.value.toString()}`
      );
    }
    const pairFromValues = bindings.value.get("pairFromValues");
    if (pairFromValues?.tag !== "Lambda") {
      throw new Error("pairFromValues helper is not a function");
    }
    return { pairFromValues: pairFromValues.value };
  })();
  return helpersPromise;
}

export type ModelEvaluatorOptions = {
  // Defaults to an in-memory cache.
  cache?: RelativeValuesCache;
  // Defaults to the environment that the comparison function was created in.
  environment?: Env;
  // Squiggle source that defines the comparison function; used to build
  // per-pair Squiggle snippets in the list view sidebar.
  modelCode?: string;
  // Squiggle expression, evaluated in the scope of `modelCode`, that returns
  // the comparison function.
  fnExpression?: string;
};

export type CreateModelEvaluatorOptions = Omit<
  ModelEvaluatorOptions,
  "modelCode" | "fnExpression"
> & {
  linker?: SqLinker;
};

/**
 * Computes relative values for pairs of items, given a Squiggle function
 * `fn(id1, id2) -> [dist1, dist2]`.
 *
 * Results are memoized in a pluggable cache.
 */
export class ModelEvaluator {
  readonly cache: RelativeValuesCache;
  readonly modelCode: string | undefined;
  readonly fnExpression: string | undefined;

  private constructor(
    private wrappedFn: SqLambda,
    private environment: Env,
    options: ModelEvaluatorOptions
  ) {
    this.cache = options.cache ?? new InMemoryRelativeValuesCache();
    this.modelCode = options.modelCode;
    this.fnExpression = options.fnExpression;
  }

  /**
   * Build an evaluator from a Squiggle lambda `fn(id1, id2) -> [dist1, dist2]`.
   */
  static fromLambda(
    fn: SqLambda,
    options: ModelEvaluatorOptions = {}
  ): result<ModelEvaluator, string> {
    const environment =
      options.environment ??
      fn.context?.runContext.environment ??
      defaultEnvironment;

    const wrap = SqLambda.createFromStdlibName("RelativeValues.wrap");
    const wrapped = wrap.call([SqLambdaValue.create(fn)], environment);
    if (!wrapped.ok) {
      return {
        ok: false,
        value: `Failed to wrap function: ${errorToString(wrapped.value)}`,
      };
    }
    if (wrapped.value.tag !== "Lambda") {
      return {
        ok: false,
        value: `Expected a function, got: ${wrapped.value.tag}`,
      };
    }

    return {
      ok: true,
      value: new ModelEvaluator(wrapped.value.value, environment, options),
    };
  }

  /**
   * Build an evaluator from a parsed relative values spec (see
   * `relativeValuesSpecFromSqValue`).
   */
  static async fromSpec(
    spec: RelativeValuesSpec,
    options: ModelEvaluatorOptions = {}
  ): Promise<result<ModelEvaluator, string>> {
    const fnExpression =
      options.fnExpression ??
      (spec.variableName === undefined
        ? undefined
        : spec.comparison.type === "fn"
          ? `${spec.variableName}.fn`
          : `{|a, b| [${spec.variableName}.values[a], ${spec.variableName}.values[b]]}`);

    const fullOptions = { ...options, fnExpression };

    if (spec.comparison.type === "fn") {
      return ModelEvaluator.fromLambda(spec.comparison.fn, fullOptions);
    }

    const { pairFromValues } = await getHelpers();
    const environment = options.environment ?? defaultEnvironment;
    const fn = pairFromValues.call([spec.comparison.values], environment);
    if (!fn.ok) {
      return { ok: false, value: errorToString(fn.value) };
    }
    if (fn.value.tag !== "Lambda") {
      return { ok: false, value: `Expected a function, got ${fn.value.tag}` };
    }
    return ModelEvaluator.fromLambda(fn.value.value, {
      environment,
      ...fullOptions,
    });
  }

  /**
   * Evaluate Squiggle code and build an evaluator from one of its top-level
   * variables.
   *
   * The variable can be either a function `fn(id1, id2) -> [dist1, dist2]`
   * (the classic Squiggle Hub convention), or a relative values spec dict
   * (`{ items, fn }` or `{ values }`, see README).
   *
   * Non-exported variables are supported, so the model doesn't need to
   * `export` the function.
   */
  static async create(
    modelCode: string,
    variableName: string,
    options: CreateModelEvaluatorOptions = {}
  ): Promise<result<ModelEvaluator, string>> {
    const { linker, ...evaluatorOptions } = options;
    const output = await run(modelCode, {
      linker,
      environment: options.environment,
    });

    const bindings = output.getBindings();
    if (!bindings.ok) {
      return {
        ok: false,
        value: `Failed to evaluate Squiggle code: ${bindings.value.toStringWithDetails()}`,
      };
    }

    const value = bindings.value.get(variableName);
    if (!value) {
      return {
        ok: false,
        value: `Variable ${variableName} not found in the model`,
      };
    }

    if (value.tag === "Lambda") {
      return ModelEvaluator.fromLambda(value.value, {
        ...evaluatorOptions,
        modelCode,
        fnExpression: variableName,
      });
    }

    const spec = relativeValuesSpecFromSqValue(value, { variableName });
    if (!spec.ok) {
      return {
        ok: false,
        value: `Expected ${variableName} to be a function or a relative values spec, got ${value.tag}: ${spec.value}`,
      };
    }
    return ModelEvaluator.fromSpec(spec.value, {
      ...evaluatorOptions,
      modelCode,
    });
  }

  /**
   * The name of a variable that holds the comparison function, if known.
   * @deprecated Use `fnExpression` instead.
   */
  get variableName(): string | undefined {
    return this.fnExpression;
  }

  compareWithoutCache(id1: string, id2: string): RelativeValueResult {
    const result = this.wrappedFn.call(
      [SqStringValue.create(id1), SqStringValue.create(id2)],
      this.environment
    );
    if (!result.ok) {
      return { ok: false, value: errorToString(result.value) };
    }
    return parseRelativeValue(result.value);
  }

  compare(id1: string, id2: string): RelativeValueResult {
    const key = makePairKey(id1, id2);
    const cachedValue = this.cache.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    const value = this.compareWithoutCache(id1, id2);
    this.cache.set(key, value);
    return value;
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
