import { ContinuousShape } from "./Continuous.js";

// TODO - rewrite with generics

export const combineIntegralSums = (
  combineFn: (v1: number, v2: number) => number | undefined,
  v1: number | undefined,
  v2: number | undefined
): number | undefined => {
  if (v1 === undefined || v2 === undefined) {
    return undefined;
  }

  return combineFn(v1, v2);
};

export const combineIntegrals = (
  combineFn: (
    v1: ContinuousShape,
    v2: ContinuousShape
  ) => ContinuousShape | undefined,
  v1: ContinuousShape | undefined,
  v2: ContinuousShape | undefined
) => {
  if (v1 === undefined || v2 === undefined) {
    return undefined;
  }

  return combineFn(v1, v2);
};
