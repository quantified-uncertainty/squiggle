import { otherError } from "../dist/DistError.js";
import { REDistributionError } from "../errors/messages.js";
import { Value, vDist } from "../value/index.js";
import * as Result from "../utility/result.js";
import * as SymbolicDist from "../dist/SymbolicDist.js";

export const CI_CONFIG = [
  { lowKey: "p5", highKey: "p95", probability: 0.9 },
  { lowKey: "p10", highKey: "p90", probability: 0.8 },
  { lowKey: "p25", highKey: "p75", probability: 0.5 },
] as const;

export type SymDistResult = Result.result<SymbolicDist.SymbolicDist, string>;

export function symDistResultToValue(result: SymDistResult): Value {
  if (!result.ok) {
    throw new REDistributionError(otherError(result.value));
  }
  return vDist(result.value);
}
