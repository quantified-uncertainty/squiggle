import * as SymbolicDist from "../../src/dist/SymbolicDist.js";
import * as Result from "../../src/utility/result.js";
import { defaultEnv, Env } from "../../src/dist/env.js";

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
export const mkPointMass = (x: number) =>
  unpackResult(SymbolicDist.PointMass.make(x));
