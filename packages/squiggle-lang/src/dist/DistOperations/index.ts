import { BaseDist } from "../BaseDist.js";
import { Env } from "../env.js";
import { pointwiseCombinationFloat } from "./pointwiseCombination.js";

export { binaryOperations, type BinaryOperation } from "./binaryOperations.js";
export { logScoreDistAnswer, logScoreScalarAnswer } from "./logScore.js";
export { mixture } from "./mixture.js";
export { pointwiseCombinationFloat } from "./pointwiseCombination.js";

export function scaleLog(t: BaseDist, f: number, { env }: { env: Env }) {
  return pointwiseCombinationFloat(t, {
    env,
    algebraicOperation: "Logarithm",
    f,
  });
}
