import { BaseDist } from "../../dist/BaseDist.js";
import { DistError } from "../../dist/DistError.js";
import { PointMass } from "../../dist/SymbolicDist.js";
import { Env } from "../../dist/env.js";
import {
  REDistributionError,
  REOperationError,
  REOther,
} from "../../errors/messages.js";
import { SampleMapNeedsNtoNFunction } from "../../operationError.js";
import { ReducerContext } from "../../reducer/context.js";
import { Lambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import {
  Value,
  vArray,
  vBool,
  vDist,
  vNumber,
  vString,
} from "../../value/index.js";
import { FRFunction } from "./core.js";
import { FnDefinition, makeDefinition } from "./fnDefinition.js";
import {
  frBool,
  frDist,
  frDistOrNumber,
  frNumber,
  frString,
} from "./frTypes.js";
import * as SampleSetDist from "../../dist/SampleSetDist/index.js";
import * as SymbolicDist from "../../dist/SymbolicDist.js";
import { OtherOperationError } from "../../operationError.js";

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
    };
  }

  n2n({
    fn,
    ...args
  }: ArgsWithoutDefinitions & { fn: (x: number) => number }): FRFunction {
    return this.make({
      ...args,
      output: "Number",
      definitions: [makeDefinition([frNumber], ([x]) => vNumber(fn(x)))],
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
        makeDefinition([frNumber, frNumber], ([x, y]) => vNumber(fn(x, y))),
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
        makeDefinition([frNumber, frNumber], ([x, y]) => vBool(fn(x, y))),
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
        makeDefinition([frBool, frBool], ([x, y]) => vBool(fn(x, y))),
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
        makeDefinition([frString, frString], ([x, y]) => vBool(fn(x, y))),
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
        makeDefinition([frString, frString], ([x, y]) => vString(fn(x, y))),
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
        makeDefinition([frDist], ([dist], { environment }) =>
          vString(fn(dist, environment))
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
        makeDefinition([frDist, frNumber], ([dist, n], { environment }) =>
          vString(fn(dist, n, environment))
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
        makeDefinition([frDist], ([x], { environment }) =>
          vNumber(fn(x, environment))
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
        makeDefinition([frDist], ([x], { environment }) =>
          vBool(fn(x, environment))
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
        makeDefinition([frDist], ([dist], { environment }) =>
          vDist(fn(dist, environment))
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
        makeDefinition([frDist, frNumber], ([dist, n], { environment }) =>
          vDist(fn(dist, n, environment))
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
        makeDefinition([frDist, frNumber], ([dist, n], { environment }) =>
          vNumber(fn(dist, n, environment))
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

export function unpackDistResult<T>(result: Result.result<T, DistError>): T {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return result.value;
}

export function repackDistResult(
  result: Result.result<BaseDist, DistError>
): Value {
  const dist = unpackDistResult(result);
  return vDist(dist);
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
  typeof d == "number" ? Result.getExt(PointMass.make(d)) : d;

export function distResultToValue(
  result: Result.result<BaseDist, DistError>
): Value {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return vDist(result.value);
}

export function distsResultToValue(
  result: Result.result<BaseDist[], DistError>
): Value {
  if (!result.ok) {
    throw new REDistributionError(result.value);
  }
  return vArray(result.value.map((r) => vDist(r)));
}

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
): Value {
  const sampleFn = (a: number, b: number) =>
    Result.fmap2(
      fn(a, b),
      (d) => d.sample(),
      (e) => new OtherOperationError(e)
    );

  if (v1 instanceof BaseDist && v2 instanceof BaseDist) {
    const s1 = makeSampleSet(v1, env);
    const s2 = makeSampleSet(v2, env);
    return distResultToValue(
      SampleSetDist.map2({
        fn: sampleFn,
        t1: s1,
        t2: s2,
      })
    );
  } else if (v1 instanceof BaseDist && typeof v2 === "number") {
    const s1 = makeSampleSet(v1, env);
    return distResultToValue(s1.samplesMap((a) => sampleFn(a, v2)));
  } else if (typeof v1 === "number" && v2 instanceof BaseDist) {
    const s2 = makeSampleSet(v2, env);
    return distResultToValue(s2.samplesMap((a) => sampleFn(v1, a)));
  } else if (typeof v1 === "number" && typeof v2 === "number") {
    const result = fn(v1, v2);
    if (!result.ok) {
      throw new REOther(result.value);
    }
    return vDist(makeSampleSet(result.value, env));
  }
  throw new REOther("Impossible branch");
}

export function makeTwoArgsDist(
  fn: (
    v1: number,
    v2: number
  ) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition(
    [frDistOrNumber, frDistOrNumber],
    ([v1, v2], { environment }) => twoVarSample(v1, v2, environment, fn)
  );
}

export function makeOneArgDist(
  fn: (v: number) => Result.result<SymbolicDist.SymbolicDist, string>
) {
  return makeDefinition([frDistOrNumber], ([v], { environment }) => {
    const sampleFn = (a: number) =>
      Result.fmap2(
        fn(a),
        (d) => d.sample(),
        (e) => new OtherOperationError(e)
      );

    if (v instanceof BaseDist) {
      const s = makeSampleSet(v, environment);
      return distResultToValue(s.samplesMap(sampleFn));
    } else if (typeof v === "number") {
      const result = fn(v);
      if (!result.ok) {
        throw new REOther(result.value);
      }
      return vDist(makeSampleSet(result.value, environment));
    }
    throw new REOther("Impossible branch");
  });
}
