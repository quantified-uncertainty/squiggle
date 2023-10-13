import { REOther } from "../errors/messages.js";
import { INDEX_LOOKUP_FUNCTION } from "../expression/constants.js";
import { BuiltinLambda, Lambda } from "../reducer/lambda.js";
import { vLambda } from "../value/index.js";

import { Bindings } from "../reducer/stack.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { makeMathConstants } from "./math.js";
import { makeSquiggleBindings, registry } from "./registry/index.js";
import { makeVersionConstant } from "./version.js";
import { frAny } from "./registry/frTypes.js";
import { makeDefinition } from "./registry/fnDefinition.js";

const definitions = [
  makeDefinition([frAny, frAny], ([obj, key]) => {
    if ("get" in obj) {
      return obj.get(key).clone();
    } else {
      throw new REOther("Trying to access key on wrong value");
    }
  }),
];

function makeLookupLambda(): Lambda {
  return new BuiltinLambda(INDEX_LOOKUP_FUNCTION, definitions);
}

function makeStdLib(): Bindings {
  let res: Bindings = ImmutableMap();

  // constants
  res = res.merge(makeMathConstants());
  res = res.merge(makeVersionConstant());

  // field lookups
  res = res.set(INDEX_LOOKUP_FUNCTION, vLambda(makeLookupLambda()));

  // bind the entire FunctionRegistry
  for (const name of registry.allNames()) {
    res = res.set(name, vLambda(registry.makeLambda(name)));
  }

  res = res.merge(makeSquiggleBindings(res));

  return res;
}

// lazy cache
let cachedStdLib: Bindings | undefined;
export function getStdLib() {
  cachedStdLib ??= makeStdLib();
  return cachedStdLib;
}
