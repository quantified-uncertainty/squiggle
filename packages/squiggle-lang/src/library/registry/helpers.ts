import { BaseDist } from "../../dist/BaseDist.js";
import { DistError } from "../../dist/DistError.js";
import { Env } from "../../dist/env.js";
import { SampleMapNeedsNtoNFunction } from "../../operationError.js";
import { ReducerContext } from "../../reducer/context.js";
import {
  ErrorMessage,
  REDistributionError,
  REOperationError,
} from "../../reducer/ErrorMessage.js";
import { ReducerFn } from "../../reducer/index.js";
import { Lambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { Ok } from "../../utility/result.js";
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
      definitions: [makeDefinition([frNumber], ([x]) => Ok(vNumber(fn(x))))],
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
        makeDefinition([frNumber, frNumber], ([x, y]) => Ok(vNumber(fn(x, y)))),
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
        makeDefinition([frNumber, frNumber], ([x, y]) => Ok(vBool(fn(x, y)))),
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
        makeDefinition([frBool, frBool], ([x, y]) => Ok(vBool(fn(x, y)))),
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
        makeDefinition([frString, frString], ([x, y]) => Ok(vBool(fn(x, y)))),
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
        makeDefinition([frString, frString], ([x, y]) => Ok(vString(fn(x, y)))),
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
          Ok(vString(fn(dist, environment)))
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
          Ok(vString(fn(dist, n, environment)))
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
          Ok(vNumber(fn(x, environment)))
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
          Ok(vBool(fn(x, environment)))
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
          Ok(vDist(fn(dist, environment)))
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
          Ok(vDist(fn(dist, n, environment)))
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
          Ok(vNumber(fn(dist, n, environment)))
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
): Result.result<Value, ErrorMessage> {
  const dist = unpackDistResult(result);
  return Ok(vDist(dist));
}

export function doNumberLambdaCall(
  lambda: Lambda,
  args: Value[],
  context: ReducerContext,
  reducer: ReducerFn
) {
  const value = lambda.call(args, context, reducer);
  if (value.type === "Number") {
    return value.value;
  }
  throw new REOperationError(SampleMapNeedsNtoNFunction);
}
