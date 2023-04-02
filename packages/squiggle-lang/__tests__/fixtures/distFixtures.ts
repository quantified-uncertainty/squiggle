import * as SymbolicDist from "../../src/dist/SymbolicDist.js";
import { unpackResult } from "../helpers/distHelpers.js";

export const normalDist5 = unpackResult(
  SymbolicDist.Normal.make({ mean: 5, stdev: 2 })
);
export const normalDist10 = unpackResult(
  SymbolicDist.Normal.make({ mean: 10, stdev: 2 })
);
export const normalDist20 = unpackResult(
  SymbolicDist.Normal.make({ mean: 20, stdev: 2 })
);
export const normalDist = normalDist5;

export const betaDist = unpackResult(
  SymbolicDist.Beta.make({ alpha: 2, beta: 5 })
);
export const lognormalDist = unpackResult(
  SymbolicDist.Lognormal.make({ mu: 0, sigma: 1 })
);
export const cauchyDist = unpackResult(
  SymbolicDist.Cauchy.make({ local: 1, scale: 1 })
);
export const triangularDist = unpackResult(
  SymbolicDist.Triangular.make({ low: 1, medium: 2, high: 3 })
);
export const exponentialDist = unpackResult(SymbolicDist.Exponential.make(2));
export const uniformDist = unpackResult(
  SymbolicDist.Uniform.make({ low: 9, high: 10 })
);
export const uniformDist2 = unpackResult(
  SymbolicDist.Uniform.make({ low: 8, high: 11 })
);
export const floatDist = unpackResult(SymbolicDist.PointMass.make(10));

export const point1 = unpackResult(SymbolicDist.PointMass.make(1));
export const point2 = unpackResult(SymbolicDist.PointMass.make(2));
export const point3 = unpackResult(SymbolicDist.PointMass.make(3));
