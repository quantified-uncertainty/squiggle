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

export abstract class PointSet<Self = any> {
  abstract minX(): number;
  abstract maxX(): number;
  abstract mapY(
    fn: (y: number) => number,
    integralSumCacheFn?: (sum: number) => number | undefined,
    integralCacheFn?: (cache: ContinuousShape) => ContinuousShape | undefined
  ): Self;
  abstract mapYResult<E>(
    fn: (y: number) => rsResult<number, E>,
    integralSumCacheFn: undefined | ((sum: number) => number | undefined),
    integralCacheFn:
      | undefined
      | ((cache: ContinuousShape) => ContinuousShape | undefined)
  ): rsResult<Self, E>;
  abstract xToY(x: number): MixedPoint;
  abstract toContinuous(): ContinuousShape | undefined;
  abstract toDiscrete(): DiscreteShape | undefined;
  abstract toMixed(): MixedShape;
  abstract normalize(): Self;
  abstract toDiscreteProbabilityMassFraction(): number;
  abstract downsample(length: number): Self;
  abstract truncate(left: number | undefined, right: number | undefined): Self;

  abstract updateIntegralCache(cache: ContinuousShape | undefined): Self;

  abstract integral(): ContinuousShape;
  abstract integralEndY(): number;
  abstract integralXtoY(x: number): number;
  abstract integralYtoX(y: number): number;

  abstract mean(): number;
  abstract variance(): number;
}
