import * as SymbolicDist from "../../src/Dist/SymbolicDist";
import { unpackResult } from "../TestHelpers";

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
  SymbolicDist.Lognormal.make({ mu: 0.0, sigma: 1.0 })
);
export const cauchyDist = unpackResult(
  SymbolicDist.Cauchy.make({ local: 1.0, scale: 1.0 })
);
export const triangularDist = unpackResult(
  SymbolicDist.Triangular.make({ low: 1.0, medium: 2.0, high: 3.0 })
);
export const exponentialDist = unpackResult(SymbolicDist.Exponential.make(2.0));
export const uniformDist = unpackResult(
  SymbolicDist.Uniform.make({ low: 9.0, high: 10.0 })
);
export const uniformDist2 = unpackResult(
  SymbolicDist.Uniform.make({ low: 8.0, high: 11.0 })
);
export const floatDist = unpackResult(SymbolicDist.Float.make(1e1));

export const point1 = unpackResult(SymbolicDist.Float.make(1));
export const point2 = unpackResult(SymbolicDist.Float.make(2));
export const point3 = unpackResult(SymbolicDist.Float.make(3));
