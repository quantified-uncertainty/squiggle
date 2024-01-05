import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vString } from "../value/index.js";

export function makeVersionConstant(): ImmutableMap<string, Value> {
  // automatically updated on release by ops/ patch-js utils
  return ImmutableMap([["System.version", vString("0.9.1-0")]]);
}
