import { REOther } from "../errors/messages.js";
import { INDEX_LOOKUP_FUNCTION } from "../expression/constants.js";
import { BuiltinLambda, Lambda } from "../reducer/lambda.js";
import { Bindings } from "../reducer/Stack.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Value } from "../value/index.js";
import { vLambda } from "../value/vLambda.js";
import { makeMathConstants } from "./math.js";
import { makeDefinition } from "./registry/fnDefinition.js";
import { frAny } from "./registry/frTypes.js";
import { makeSquiggleBindings, registry } from "./registry/index.js";
import { makeVersionConstant } from "./version.js";

function makeLookupLambda(): Lambda {
  return new BuiltinLambda(INDEX_LOOKUP_FUNCTION, [
    makeDefinition([frAny(), frAny()], frAny(), ([obj, key]) => {
      if ("get" in obj) {
        return obj.get(key);
      } else {
        throw new REOther("Trying to access key on wrong value");
      }
    }),
  ]);
}

function makeStdLib(): Bindings {
  let res: Bindings = ImmutableMap<string, Value>().merge(
    // global constants
    makeMathConstants(),
    makeVersionConstant(),
    // field lookups
    [[INDEX_LOOKUP_FUNCTION, vLambda(makeLookupLambda())]],
    // most builtin functions
    registry
      .allNames()
      .map((name) => [name, vLambda(registry.makeLambda(name))] as const)
  );

  // builtin functions defined in Squiggle - this is done last because these functions can depend on other builtins
  res = res.merge(makeSquiggleBindings(res));

  return res;
}

// lazy cache
let cachedStdLib: Bindings | undefined;
export function getStdLib() {
  cachedStdLib ??= makeStdLib();
  return cachedStdLib;
}
