import { PRNG } from "seedrandom";

import { AlgebraicOperation } from "../../operation.js";
import { accumulateWithError, pairwiseWithError } from "../../utility/E_A.js";
import { bind, Ok, result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError } from "../DistError.js";
import { Env } from "../env.js";
import { PointMass } from "../SymbolicDist.js";
import { algebraicCombination } from "./algebraicCombination.js";
import { pointwiseCombination } from "./pointwiseCombination.js";

type DistResult = result<BaseDist, DistError>;

type Opts = { env: Env; rng: PRNG };

export type BinaryOperation = (
  t1: BaseDist,
  t2: BaseDist,
  opts: Opts
) => DistResult;

// private helpers
function algebraic(
  t1: BaseDist,
  t2: BaseDist,
  opts: Opts,
  operation: AlgebraicOperation
) {
  return algebraicCombination({
    t1,
    t2,
    arithmeticOperation: operation,
    env: opts.env,
    rng: opts.rng,
  });
}

function pointwise(
  t1: BaseDist,
  t2: BaseDist,
  env: Env,
  algebraicOperation: AlgebraicOperation
) {
  return pointwiseCombination({
    t1,
    t2,
    env,
    algebraicOperation,
  });
}

export const binaryOperations = {
  algebraicAdd: (t1, t2, opts) => algebraic(t1, t2, opts, "Add"),
  algebraicMultiply: (t1, t2, opts) => algebraic(t1, t2, opts, "Multiply"),
  algebraicDivide: (t1, t2, opts) => algebraic(t1, t2, opts, "Divide"),
  algebraicSubtract: (t1, t2, opts) => algebraic(t1, t2, opts, "Subtract"),
  algebraicLogarithm: (t1, t2, opts) => algebraic(t1, t2, opts, "Logarithm"),
  algebraicPower: (t1, t2, opts) => algebraic(t1, t2, opts, "Power"),

  pointwiseAdd: (t1, t2, { env }) => pointwise(t1, t2, env, "Add"),
  pointwiseMultiply: (t1, t2, { env }) => pointwise(t1, t2, env, "Multiply"),
  pointwiseDivide: (t1, t2, { env }) => pointwise(t1, t2, env, "Divide"),
  pointwiseSubtract: (t1, t2, { env }) => pointwise(t1, t2, env, "Subtract"),
  pointwiseLogarithm: (t1, t2, { env }) => pointwise(t1, t2, env, "Logarithm"),
  pointwisePower: (t1, t2, { env }) => pointwise(t1, t2, env, "Power"),
} satisfies { [k: string]: BinaryOperation };

type AlgebraicFn = (dists: BaseDist[], opts: Opts) => DistResult;
type AlgebraicCumFn = (
  dists: BaseDist[],
  opts: Opts
) => result<BaseDist[], DistError>;

export const algebraicSum: AlgebraicFn = (dists, opts) =>
  dists.reduce<DistResult>(
    (accumulatedDist, currentDist) =>
      bind(accumulatedDist, (aVal) =>
        binaryOperations.algebraicAdd(aVal, currentDist, opts)
      ),
    Ok(new PointMass(0))
  );

export const algebraicProduct: AlgebraicFn = (dists, opts) =>
  dists.reduce<DistResult>(
    (accumulatedDist, currentDist) =>
      bind(accumulatedDist, (aVal) =>
        binaryOperations.algebraicMultiply(aVal, currentDist, opts)
      ),
    Ok(new PointMass(1))
  );

export const algebraicCumSum: AlgebraicCumFn = (dists, opts) =>
  accumulateWithError(dists, (a, b) =>
    binaryOperations.algebraicAdd(a, b, opts)
  );

export const algebraicCumProd: AlgebraicCumFn = (dists, opts) =>
  accumulateWithError(dists, (a, b) =>
    binaryOperations.algebraicMultiply(a, b, opts)
  );

export const algebraicDiff: AlgebraicCumFn = (dists, opts) =>
  pairwiseWithError(dists, (a, b) =>
    binaryOperations.algebraicSubtract(b, a, opts)
  );
