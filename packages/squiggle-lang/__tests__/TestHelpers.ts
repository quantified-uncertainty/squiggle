import * as SymbolicDist from "../src/Dist/SymbolicDist";
import { rsResult } from "../src/rsResult";
import * as RSResult from "../src/rsResult";
import { defaultEnv, Env } from "../src/Dist/env";

/*
This encodes the expression for percent error
The test says "the percent error of received against expected is bounded by epsilon"

However, the semantics are degraded by catching some numerical instability: 
when expected is too small, the return of this function might blow up to infinity. 
So we capture that by taking the max of abs(expected) against a 1. 

A sanity check of this function would be welcome, in general it is a better way of approaching 
squiggle-lang tests than toBeSoCloseTo. 
*/
export const expectErrorToBeBounded = (
  received: number,
  expected: number,
  { epsilon }: { epsilon: number }
) => {
  const distance = Math.abs(received - expected);
  const expectedAbs = Math.abs(expected);
  const normalizingDenom = Math.max(expectedAbs, 1);
  const error = distance / normalizingDenom;
  return expect(error).toBeLessThan(epsilon);
};

// let makeTest = (~only=false, str, item1, item2) =>
//   only
//     ? Only.test(str, () => expect(item1)->toEqual(item2))
//     : test(str, () => expect(item1)->toEqual(item2))

// let fnImage = (theFn, inps) => Js.Array.map(theFn, inps)

export const env: Env = defaultEnv;

export const unpackResult = <T>(x: rsResult<T, unknown>): T => {
  if (x.TAG === RSResult.E.Error) {
    throw new Error("failed");
  }
  return x._0;
};

// let unreachableInTestFileMessage = "Should be impossible to reach (This error is in test file)"
// let toExtFloat: option<float> => float = E.O.toExt(_, unreachableInTestFileMessage)
// let toExtDist: option<DistributionTypes.genericDist> => DistributionTypes.genericDist = E.O.toExt(
//   _,
//   unreachableInTestFileMessage,
// )

export const mkNormal = (mean: number, stdev: number) =>
  unpackResult(SymbolicDist.Normal.make({ mean, stdev }));
export const mkBeta = (alpha: number, beta: number) =>
  unpackResult(SymbolicDist.Beta.make({ alpha, beta }));
export const mkExponential = (rate: number) =>
  unpackResult(SymbolicDist.Exponential.make(rate));
export const mkUniform = (low: number, high: number) =>
  unpackResult(SymbolicDist.Uniform.make({ low, high }));
export const mkCauchy = (local: number, scale: number) =>
  unpackResult(SymbolicDist.Cauchy.make({ local, scale }));
export const mkLognormal = (mu: number, sigma: number) =>
  unpackResult(SymbolicDist.Lognormal.make({ mu, sigma }));
export const mkTriangular = (low: number, medium: number, high: number) =>
  unpackResult(SymbolicDist.Triangular.make({ low, medium, high }));
export const mkDelta = (x: number) => unpackResult(SymbolicDist.Float.make(x));

export const normalMake = SymbolicDist.Normal.make;
export const betaMake = SymbolicDist.Beta.make;
export const exponentialMake = SymbolicDist.Exponential.make;
export const uniformMake = SymbolicDist.Uniform.make;
export const cauchyMake = SymbolicDist.Cauchy.make;
export const lognormalMake = SymbolicDist.Lognormal.make;
export const triangularMake = SymbolicDist.Triangular.make;
export const floatMake = SymbolicDist.Float.make;

export const normalMakeR = (mean: number, stdev: number) =>
  SymbolicDist.Normal.make({ mean, stdev });
export const betaMakeR = (alpha: number, beta: number) =>
  SymbolicDist.Beta.make({ alpha, beta });
export const exponentialMakeR = (rate: number) =>
  SymbolicDist.Exponential.make(rate);
export const uniformMakeR = (low: number, high: number) =>
  SymbolicDist.Uniform.make({ low, high });
export const cauchyMakeR = (local: number, scale: number) =>
  SymbolicDist.Cauchy.make({ local, scale });
export const lognormalMakeR = (mu: number, sigma: number) =>
  SymbolicDist.Lognormal.make({ mu, sigma });
export const triangularMakeR = (low: number, medium: number, high: number) =>
  SymbolicDist.Triangular.make({ low, medium, high });
