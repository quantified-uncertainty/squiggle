import intersection from "lodash/intersection.js";
import last from "lodash/last.js";
import mergeWith from "lodash/mergeWith.js";

import { BaseDist } from "../../dist/BaseDist.js";
import { DistError } from "../../dist/DistError.js";
import { Env } from "../../dist/env.js";
import * as SampleSetDist from "../../dist/SampleSetDist/index.js";
import * as SymbolicDist from "../../dist/SymbolicDist.js";
import { PointMass } from "../../dist/SymbolicDist.js";
import {
  REArgumentError,
  REDistributionError,
  REOperationError,
  REOther,
} from "../../errors/messages.js";
import {
  OtherOperationError,
  SampleMapNeedsNtoNFunction,
} from "../../operationError.js";
import { ReducerContext } from "../../reducer/context.js";
import { Lambda } from "../../reducer/lambda.js";
import { upTo } from "../../utility/E_A_Floats.js";
import * as Result from "../../utility/result.js";
import { Input, Scale, Value, VDomain } from "../../value/index.js";
import { FRFunction } from "./core.js";
import { FnDefinition, makeDefinition } from "./fnDefinition.js";
import {
  frBool,
  frDist,
  frDistOrNumber,
  frNamed,
  frNumber,
  frSampleSetDist,
  frString,
  FRType,
  isOptional,
} from "./frTypes.js";

type SimplifiedArgs = Omit<FRFunction, "nameSpace" | "requiresNamespace"> &
  Partial<Pick<FRFunction, "nameSpace" | "requiresNamespace">>;

type ArgsWithoutDefinitions = Omit<SimplifiedArgs, "definitions">;

export class FnFactory {
  nameSpace: string;
  requiresNamespace: boolean;

  constructor(opts: { nameSpace: string; requiresNamespace: boolean }) {
    this.nameSpace = opts.nameSpace;
    this.requiresNamespace = opts.requiresNamespace;
  }

  make(args: SimplifiedArgs): FRFunction {
    return {
      nameSpace: this.nameSpace,
      requiresNamespace: this.requiresNamespace,
      ...args,
      isUnit: args.isUnit ?? false,
    };
  }

  n2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & { fn: (x: number) => number }): FRFunction {
    return this.make({
      ...args,
      output: "Number",
      definitions: [makeDefinition([frNumber], frNumber, ([x]) => fn(x))],
    });
  }

  nn2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: number, y: number) => number;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Number",
      definitions: [
        makeDefinition([frNumber, frNumber], frNumber, ([x, y]) => fn(x, y)),
      ],
    });
  }

  nn2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: number, y: number) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Bool",
      definitions: [
        makeDefinition([frNumber, frNumber], frBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  bb2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: boolean, y: boolean) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Bool",
      definitions: [
        makeDefinition([frBool, frBool], frBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  ss2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: string, y: string) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Bool",
      definitions: [
        makeDefinition([frString, frString], frBool, ([x, y]) => fn(x, y)),
      ],
    });
  }

  ss2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: string, y: string) => string;
  }): FRFunction {
    return this.make({
      ...args,
      output: "String",
      definitions: [
        makeDefinition([frString, frString], frString, ([x, y]) => fn(x, y)),
      ],
    });
  }

  d2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, env: Env) => string;
  }): FRFunction {
    return this.make({
      ...args,
      output: "String",
      definitions: [
        makeDefinition([frDist], frString, ([dist], { environment }) =>
          fn(dist, environment)
        ),
      ],
    });
  }

  dn2s({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, env: Env) => string;
  }): FRFunction {
    return this.make({
      ...args,
      output: "String",
      definitions: [
        makeDefinition(
          [frDist, frNumber],
          frString,
          ([dist, n], { environment }) => fn(dist, n, environment)
        ),
      ],
    });
  }

  d2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: BaseDist, env: Env) => number;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Number",
      definitions: [
        makeDefinition([frDist], frNumber, ([x], { environment }) =>
          fn(x, environment)
        ),
      ],
    });
  }

  d2b({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (x: BaseDist, env: Env) => boolean;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Bool",
      definitions: [
        makeDefinition([frDist], frBool, ([x], { environment }) =>
          fn(x, environment)
        ),
      ],
    });
  }

  d2d({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, env: Env) => BaseDist;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Dist",
      definitions: [
        makeDefinition([frDist], frDist, ([dist], { environment }) =>
          fn(dist, environment)
        ),
      ],
    });
  }

  dn2d({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, env: Env) => BaseDist;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Dist",
      definitions: [
        makeDefinition(
          [frDist, frNumber],
          frDist,
          ([dist, n], { environment }) => fn(dist, n, environment)
        ),
      ],
    });
  }

  dn2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & {
    fn: (dist: BaseDist, n: number, env: Env) => number;
  }): FRFunction {
    return this.make({
      ...args,
      output: "Number",
      definitions: [
        makeDefinition(
          [frDist, frNumber],
          frNumber,
          ([dist, n], { environment }) => fn(dist, n, environment)
        ),
      ],
    });
  }

  fromDefinition(name: string, def: FnDefinition) {
    return this.make({
      name,
      definitions: [def],
    });
  }
}

export function unwrapDistResult<T>(result: Result.result<T, DistError>): T {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

export function doNumberLambdaCall(
  lambda: Lambda,
  args: Value[],
  context: ReducerContext
): number {
  const value = lambda.call(args, context);
  if (value.type === "Number") {
    return value.value;
  }
  throw new REOperationError(new SampleMapNeedsNtoNFunction());
}

export function doBinaryLambdaCall(
  args: Value[],
  lambda: Lambda,
  context: ReducerContext
): boolean {
  const value = lambda.call(args, context);
  if (value.type === "Bool") {
    return value.value;
  }
  throw new REOther("Expected function to return a boolean value");
}

export const parseDistFromDistOrNumber = (d: number | BaseDist): BaseDist =>
  typeof d === "number" ? Result.getExt(PointMass.make(d)) : d;

export function makeSampleSet(d: BaseDist, env: Env) {
  const result = SampleSetDist.SampleSetDist.fromDist(d, env);
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

export function twoVarSample(
  v1: BaseDist | number,
  v2: BaseDist | number,
  env: Env,
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
): SampleSetDist.SampleSetDist {
  const sampleFn = (a: number, b: number) =>
    Result.fmap2(
      fn(a, b),
      (d) => d.sample(),
      (e) => new OtherOperationError(e)
    );

  if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
    const s1 = makeSampleSet(v1, env);
    const s2 = makeSampleSet(v2, env);
    return unwrapDistResult(
      SampleSetDist.map2({
        fn: sampleFn,
        t1: s1,
        t2: s2,
      })
    );
  } else if (v1 instanceof BaseDist && typeof v2 === "number") {
    const s1 = makeSampleSet(v1, env);
    return unwrapDistResult(s1.samplesMap((a) => sampleFn(a, v2)));
  } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
    const s2 = makeSampleSet(v2, env);
    return unwrapDistResult(s2.samplesMap((a) => sampleFn(v1, a)));
  } else if (typeof v1 === "number" && typeof v2 === "number") {
    const result = fn(v1, v2);
    if (!result.ok) {
      throw new REOther(result.value);
    }
    return makeSampleSet(result.value, env);
  }
  throw new REOther("Impossible branch");
}

export function makeTwoArgsSamplesetDist(
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>,
  name1: string,
  name2: string
) {
  return makeDefinition(
    [frNamed(name1, frDistOrNumber), frNamed(name2, frDistOrNumber)],
    frSampleSetDist,
    ([v1, v2], { environment }) => twoVarSample(v1, v2, environment, fn)
  );
}

export function makeOneArgSamplesetDist(
  fn: (v: number) => Result.result<SymbolicDist.SymbolicDist, string>,
  name: string
) {
  return makeDefinition(
    [frNamed(name, frDistOrNumber)],
    frSampleSetDist,
    ([v], { environment }) => {
      const sampleFn = (a: number) =>
        Result.fmap2(
          fn(a),
          (d) => d.sample(),
          (e) => new OtherOperationError(e)
        );

      if (v instanceof BaseDist) {
        const s = makeSampleSet(v, environment);
        return unwrapDistResult(s.samplesMap(sampleFn));
      } else if (typeof v === "number") {
        const result = fn(v);
        if (!result.ok) {
          throw new REOther(result.value);
        }
        return makeSampleSet(result.value, environment);
      }
      throw new REOther("Impossible branch");
    }
  );
}

function createComparisonDefinition<T>(
  fnFactory: FnFactory,
  opName: string,
  comparisonFunction: (d1: T, d2: T) => boolean,
  frType: FRType<T>
): FRFunction {
  return fnFactory.make({
    name: opName,
    definitions: [
      makeDefinition([frType, frType], frBool, ([d1, d2]) =>
        comparisonFunction(d1, d2)
      ),
    ],
  });
}

export function makeNumericComparisons<T>(
  fnFactory: FnFactory,
  smaller: (d1: T, d2: T) => boolean,
  larger: (d1: T, d2: T) => boolean,
  isEqual: (d1: T, d2: T) => boolean,
  frType: FRType<T>
): FRFunction[] {
  return [
    createComparisonDefinition(fnFactory, "smaller", smaller, frType),
    createComparisonDefinition(fnFactory, "larger", larger, frType),
    createComparisonDefinition(
      fnFactory,
      "smallerEq",
      (d1, d2) => smaller(d1, d2) || isEqual(d1, d2),
      frType
    ),
    createComparisonDefinition(
      fnFactory,
      "largerEq",
      (d1, d2) => larger(d1, d2) || isEqual(d1, d2),
      frType
    ),
  ];
}

// In cases where we have a function that takes a lambda as an argument, and it's possible we could use n to m arguments, we want to choose the largest number of arguments that matches the lambda.
export const chooseLambdaParamLength = (
  inputOptions: number[],
  lambda: Lambda
): number | undefined => {
  const _overlap = intersection(inputOptions, lambda.parameterCounts());
  return last(_overlap);
};

// A helper to check if a list of frTypes would match inputs of a given length.
// Non-trivial because of optional arguments.
export const frTypesMatchesLengths = (
  inputs: FRType<any>[],
  lengths: number[]
): boolean => {
  const min = inputs.filter((i) => !isOptional(i)).length;
  const max = inputs.length;
  return intersection(upTo(min, max), lengths).length > 0;
};

export const frTypeToInput = (
  frType: FRType<any>,
  i: number,
  name: string
): Input => {
  const type = frType.fieldType || "text";
  switch (type) {
    case "text":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.default || "",
      };
    case "textArea":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.default || "",
      };
    case "checkbox":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.default === "true" ? true : false,
      };
    case "select":
      return {
        name,
        type,
        typeName: frType.display(),
        default: frType.default || "",
        options: [],
      };
  }
};
// Regex taken from d3-format.
// https://github.com/d3/d3-format/blob/f3cb31091df80a08f25afd4a7af2dcb3a6cd5eef/src/formatSpecifier.js#L1C65-L2C85
const d3TickFormatRegex =
  /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

export function checkNumericTickFormat(tickFormat: string | null) {
  if (tickFormat && !d3TickFormatRegex.test(tickFormat)) {
    throw new REArgumentError(`Tick format [${tickFormat}] is invalid.`);
  }
}

// This function both extract the domain and checks that the function has only one parameter.
export function extractDomainFromOneArgFunction(
  fn: Lambda
): VDomain | undefined {
  const counts = fn.parameterCounts();
  if (!counts.includes(1)) {
    throw new REOther(
      `Unreachable: extractDomainFromOneArgFunction() called with function that doesn't have exactly one parameter.`
    );
  }

  let domain;
  if (fn.type === "UserDefinedLambda") {
    domain = fn.parameters[0]?.domain;
  } else {
    domain = undefined;
  }
  // We could also verify a domain here, to be more confident that the function expects numeric args.
  // But we might get other numeric domains besides `NumericRange`, so checking domain type here would be risky.
  return domain;
}

export function assertValidMinMax(scale: Scale) {
  const hasMin = scale.min !== undefined;
  const hasMax = scale.max !== undefined;

  // Validate scale properties
  if (hasMin !== hasMax) {
    throw new REArgumentError(
      `Scale ${hasMin ? "min" : "max"} set without ${
        hasMin ? "max" : "min"
      }. Must set either both or neither.`
    );
  } else if (hasMin && hasMax && scale.min! >= scale.max!) {
    throw new REArgumentError(
      `Scale min (${scale.min}) is greater or equal than than max (${scale.max})`
    );
  }
}

const defaultScale = { method: { type: "linear" } };

export function assertScaleMatchesDomain(
  scale: Scale | undefined,
  domain: VDomain | undefined
): void {
  if (domain && scale) {
    if (domain.value.type === "NumericRange" && scale.method?.type === "date") {
      throw new REArgumentError("Cannot use numeric domain with date scale");
    } else if (
      domain.value.type === "DateRange" &&
      scale.method?.type !== "date"
    ) {
      throw new REArgumentError("Cannot use date domain with non-date scale");
    }
  }
}

export function createScaleUsingDomain(
  scale: Scale | null,
  domain: VDomain | undefined
): Scale {
  /*
   * There are several possible combinations here:
   * 1. Scale with min/max -> ignore domain, keep scale
   * 2. Scale without min/max, domain defined -> copy min/max from domain
   * 3. Scale without min/max, no domain -> keep scale
   * 4. No scale and no domain -> default scale
   */
  //TODO: It might be good to check if scale is outside the bounds of the domain, and throw an error then or something.

  scale && assertValidMinMax(scale);

  assertScaleMatchesDomain(scale || undefined, domain);

  const _defaultScale = domain ? domain.value.toDefaultScale() : defaultScale;

  // _defaultScale can have a lot of undefined values. These should be over-written.
  const resultScale = mergeWith(
    {},
    scale || {},
    _defaultScale,
    (scaleValue, defaultValue) => scaleValue ?? defaultValue
  );

  return resultScale;
}

export const assertScaleNotDateScale = (scale: Scale | null) => {
  if (scale && scale.method?.type === "date") {
    throw new REArgumentError(
      "Using a date scale as the plot yScale is not yet supported."
    );
  }
};
