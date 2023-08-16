import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vString } from "../value/index.js";

export function makeVersionConstant(): ImmutableMap<string, Value> {
  // TODO - generate during build based on package.json
  return ImmutableMap([["System.version", vString("0.8.4")]]);
}
