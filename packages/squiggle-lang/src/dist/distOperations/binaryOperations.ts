import { AlgebraicOperation } from "../../operation.js";
import { accumulateWithError, pairwiseWithError } from "../../utility/E_A.js";
import { result, Ok, bind } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError } from "../DistError.js";
import { PointMass } from "../SymbolicDist.js";
import { Env } from "../env.js";
import { algebraicCombination } from "./algebraicCombination.js";
import { pointwiseCombination } from "./pointwiseCombination.js";

type DistResult = result<BaseDist, DistError>;

export type BinaryOperation = (
  t1: BaseDist,
  t2: BaseDist,
  opts: { env: Env }
) => DistResult;

// private helpers
function algebraic(
  t1: BaseDist,
  t2: BaseDist,
  env: Env,
  operation: AlgebraicOperation
) {
  return algebraicCombination({ t1, t2, arithmeticOperation: operation, env });
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
  algebraicAdd: (t1, t2, { env }) => algebraic(t1, t2, env, "Add"),
  algebraicMultiply: (t1, t2, { env }) => algebraic(t1, t2, env, "Multiply"),
  algebraicDivide: (t1, t2, { env }) => algebraic(t1, t2, env, "Divide"),
  algebraicSubtract: (t1, t2, { env }) => algebraic(t1, t2, env, "Subtract"),
  algebraicLogarithm: (t1, t2, { env }) => algebraic(t1, t2, env, "Logarithm"),
  algebraicPower: (t1, t2, { env }) => algebraic(t1, t2, env, "Power"),

  pointwiseAdd: (t1, t2, { env }) => pointwise(t1, t2, env, "Add"),
  pointwiseMultiply: (t1, t2, { env }) => pointwise(t1, t2, env, "Multiply"),
  pointwiseDivide: (t1, t2, { env }) => pointwise(t1, t2, env, "Divide"),
  pointwiseSubtract: (t1, t2, { env }) => pointwise(t1, t2, env, "Subtract"),
  pointwiseLogarithm: (t1, t2, { env }) => pointwise(t1, t2, env, "Logarithm"),
  pointwisePower: (t1, t2, { env }) => pointwise(t1, t2, env, "Power"),
} satisfies { [k: string]: BinaryOperation };

type DistsResult = result<BaseDist[], DistError>;
export const algebraicSum = (dists: BaseDist[], env: Env): DistResult =>
  dists.reduce<DistResult>(
    (accumulatedDist, currentDist) =>
      bind(accumulatedDist, (aVal) =>
        binaryOperations.algebraicAdd(aVal, currentDist, { env })
      ),
    Ok(new PointMass(0))
  );

export const algebraicProduct = (dists: BaseDist[], env: Env): DistResult =>
  dists.reduce<DistResult>(
    (accumulatedDist, currentDist) =>
      bind(accumulatedDist, (aVal) =>
        binaryOperations.algebraicMultiply(aVal, currentDist, { env })
      ),
    Ok(new PointMass(1))
  );

export const algebraicCumSum = (dists: BaseDist[], env: Env): DistsResult =>
  accumulateWithError(dists, (a, b) =>
    binaryOperations.algebraicAdd(a, b, { env })
  );

export const algebraicCumProd = (dists: BaseDist[], env: Env): DistsResult =>
  accumulateWithError(dists, (a, b) =>
    binaryOperations.algebraicMultiply(a, b, { env })
  );

export const algebraicDiff = (dists: BaseDist[], env: Env): DistsResult =>
  pairwiseWithError(dists, (a, b) =>
    binaryOperations.algebraicSubtract(b, a, {
      env,
    })
  );
