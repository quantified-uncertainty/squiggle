import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vString } from "../value/index.js";

export function makeVersionConstant(): ImmutableMap<string, Value> {
  // automatically updated on release
  return ImmutableMap([["System.version", vString("0.8.7-0")]]);
}
