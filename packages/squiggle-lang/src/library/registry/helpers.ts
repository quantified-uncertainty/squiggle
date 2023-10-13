import { BaseDist } from "../../dist/BaseDist.js";
import { DistError } from "../../dist/DistError.js";
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
import { Value, vBool, vDist, vNumber, vString } from "../../value/index.js";
import { FRFunction } from "./core.js";
import { FnDefinition, makeDefinition } from "./fnDefinition.js";
import { frBool, frDist, frNumber, frString } from "./frTypes.js";

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
