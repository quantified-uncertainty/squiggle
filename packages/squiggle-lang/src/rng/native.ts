import { PRNG } from "./types.js";

export function getNativeRng(): PRNG {
  return Math.random;
}
