import { ImmutableMap } from "../utility/immutableMap.js";
import { Value } from "../value/index.js";
import { vString } from "../value/VString.js";

// automatically updated on release by ops/ patch-js utils
const VERSION = "0.9.3";
export function makeVersionConstant(): ImmutableMap<string, Value> {
  return ImmutableMap([["System.version", vString(VERSION)]]);
}
