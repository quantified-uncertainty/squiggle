import * as SymbolicDist from "../../src/Dist/SymbolicDist";
import * as Result from "../../src/utility/result";
import { defaultEnv, Env } from "../../src/Dist/env";

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

export const env: Env = defaultEnv;

export const unpackResult = <T>(x: Result.result<T, unknown>): T => {
  if (!x.ok) {
    throw new Error("failed");
  }
  return x.value;
};

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
export const mkLogistic = (location: number, scale: number) =>
  unpackResult(SymbolicDist.Logistic.make({ location, scale }));
export const mkTriangular = (low: number, medium: number, high: number) =>
  unpackResult(SymbolicDist.Triangular.make({ low, medium, high }));
export const mkBernoulli = (p: number) =>
  unpackResult(SymbolicDist.Bernoulli.make(p));
export const mkDelta = (x: number) => unpackResult(SymbolicDist.Float.make(x));
