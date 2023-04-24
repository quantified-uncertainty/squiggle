import { BaseDist } from "../BaseDist.js";
import { Env } from "../env.js";
import { pointwiseCombinationFloat } from "./pointwiseCombination.js";

export function scaleLog(dist: BaseDist, f: number, { env }: { env: Env }) {
  return pointwiseCombinationFloat(dist, {
    env,
    algebraicOperation: "Logarithm",
    f,
  });
}

export function scaleMultiply(
  dist: BaseDist,
  f: number,
  { env }: { env: Env }
) {
  return pointwiseCombinationFloat(dist, {
    env,
    algebraicOperation: "Multiply",
    f,
  });
}
