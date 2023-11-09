import * as Continuous from "../PointSet/Continuous.js";
import * as Discrete from "../PointSet/Discrete.js";
import * as Mixed from "../PointSet/Mixed.js";

import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { ContinuousShape } from "./Continuous.js";
import { DiscreteShape } from "./Discrete.js";
import { MixedShape } from "./Mixed.js";
import { MixedPoint } from "./MixedPoint.js";

export type ConvolutionOperation = "Add" | "Multiply" | "Subtract";
export type DistributionType = "PDF" | "CDF";

export const convolutionOperationToFn = (
  op: ConvolutionOperation
): ((x: number, y: number) => number) => {
  return {
    Add: (x: number, y: number) => x + y,
    Multiply: (x: number, y: number) => x * y,
    Subtract: (x: number, y: number) => x - y,
  }[op];
};

export type AnyPointSet = MixedShape | ContinuousShape | DiscreteShape;

export interface PointSet<T> {
  minX(): number;
  maxX(): number;
  mapY(
    fn: (y: number) => number,
    integralSumCacheFn?: (sum: number) => number | undefined,
    integralCacheFn?: (cache: ContinuousShape) => ContinuousShape | undefined
  ): T;
  mapYResult<E>(
    fn: (y: number) => result<number, E>,
    integralSumCacheFn: undefined | ((sum: number) => number | undefined),
    integralCacheFn:
      | undefined
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
  ): result<T, E>;
  xToY(x: number): MixedPoint;
  isEmpty(): boolean;
  toContinuous(): ContinuousShape | undefined;
  toDiscrete(): DiscreteShape | undefined;
  toMixed(): MixedShape;
  normalize(): T;
  toDiscreteProbabilityMassFraction(): number;
  downsample(length: number): T;
  truncate(left: number | undefined, right: number | undefined): T;

  integral(): ContinuousShape;
  integralSum(): number;
  integralXtoY(x: number): number;
  integralYtoX(y: number): number;

  withAdjustedIntegralSum(sum: number): T; // force a given sum (useful for normalization)

  mean(): number;
  variance(): number;
}

export const combinePointwise = <E>(
  t1: AnyPointSet,
  t2: AnyPointSet,
  fn: (v1: number, v2: number) => Result.result<number, E>,
  integralSumCachesFn: (v1: number, v2: number) => number | undefined = () =>
    undefined,
  integralCachesFn: (
    s1: ContinuousShape,
    s2: ContinuousShape
  ) => ContinuousShape | undefined = () => undefined
): result<AnyPointSet, E> => {
  if (t1 instanceof ContinuousShape && t2 instanceof ContinuousShape) {
    return Continuous.combinePointwise(
      t1,
      t2,
      fn,
      undefined,
      integralSumCachesFn
    );
  } else if (t1 instanceof DiscreteShape && t2 instanceof DiscreteShape) {
    return Discrete.combinePointwise(t1, t2, fn);
  } else {
    return Mixed.combinePointwise(
      t1.toMixed(),
      t2.toMixed(),
      fn,
      integralSumCachesFn,
      integralCachesFn
    );
  }
};

export const isContinuous = (d: AnyPointSet): d is ContinuousShape =>
  d instanceof ContinuousShape;
export const isDiscrete = (d: AnyPointSet): d is DiscreteShape =>
  d instanceof DiscreteShape;
