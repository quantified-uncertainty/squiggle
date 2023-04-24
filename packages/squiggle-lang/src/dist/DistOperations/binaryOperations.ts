import { AlgebraicOperation } from "../../operation.js";
import { result } from "../../utility/result.js";
import { BaseDist } from "../BaseDist.js";
import { DistError } from "../DistError.js";
import { Env } from "../env.js";
import { algebraicCombination } from "./AlgebraicCombination.js";
import { pointwiseCombination } from "./pointwiseCombination.js";

export type BinaryOperation = (
  t1: BaseDist,
  t2: BaseDist,
  opts: { env: Env }
) => result<BaseDist, DistError>;

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

export const binaryOperations: { [k: string]: BinaryOperation } = {
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
};
