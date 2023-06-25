import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vNumber } from "../value/index.js";

const availableNumbers: [string, number][] = [
  ["Math.pi", Math.PI],
  ["Math.e", Math.E],
  ["Math.ln2", Math.LN2],
  ["Math.ln10", Math.LN10],
  ["Math.log2e", Math.LOG2E],
  ["Math.log10e", Math.LOG10E],
  ["Math.sqrt2", Math.SQRT2],
  ["Math.sqrt1_2", Math.SQRT1_2],
  ["Math.phi", 1.618033988749895],
  ["Math.tau", 6.283185307179586],
];

export function makeMathConstants(): ImmutableMap<string, Value> {
  return ImmutableMap(availableNumbers.map(([name, v]) => [name, vNumber(v)]));
}
