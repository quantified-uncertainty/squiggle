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

export function scaleLogWithThreshold(
  dist: BaseDist,
  { env, base, eps }: { env: Env; base: number; eps: number }
) {
  return pointwiseCombinationFloat(dist, {
    env,
    algebraicOperation: {
      NAME: "LogarithmWithThreshold",
      VAL: eps,
    },
    f: base,
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

export function scalePower(dist: BaseDist, f: number, { env }: { env: Env }) {
  return pointwiseCombinationFloat(dist, {
    env,
    algebraicOperation: "Power",
    f,
  });
}
