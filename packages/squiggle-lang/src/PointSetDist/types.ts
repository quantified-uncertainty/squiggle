import { rsResult } from "../rsResult";
import { ContinuousShape } from "./Continuous";
import { DiscreteShape } from "./Discrete";
import { MixedShape } from "./Mixed";
import { MixedPoint } from "./MixedPoint";

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

// based on `module type dist` from Distributions.res
export type PointSet<T> = {
  minX: (t: T) => number;
  maxX: (t: T) => number;
  mapY: (
    t: T,
    fn: (y: number) => number,
    integralSumCacheFn?: (sum: number) => number | undefined,
    integralCacheFn?: (cache: ContinuousShape) => ContinuousShape | undefined
  ) => T;
  mapYResult: <E>(
    t: T,
    fn: (y: number) => rsResult<number, E>,
    integralSumCacheFn: (sum: number) => number | undefined,
    integralCacheFn: (cache: ContinuousShape) => ContinuousShape | undefined
  ) => rsResult<T, E>;
  xToY: (x: number, t: T) => MixedPoint;
  // toPointSetDist: (t: T) => PointSetTypes.pointSetDist;
  toContinuous: (t: T) => ContinuousShape | undefined;
  toDiscrete: (t: T) => DiscreteShape | undefined;
  toMixed: (t: T) => MixedShape;
  normalize: (t: T) => T;
  toDiscreteProbabilityMassFraction: (t: T) => number;
  downsample: (length: number, t: T) => T;
  truncate: (left: number | undefined, right: number | undefined, t: T) => T;

  updateIntegralCache: (t: T, cache: ContinuousShape | undefined) => T;

  integral: (t: T) => ContinuousShape;
  integralEndY: (t: T) => number;
  integralXtoY: (x: number, t: T) => number;
  integralYtoX: (y: number, t: T) => number;

  mean: (t: T) => number;
  variance: (t: T) => number;
};
