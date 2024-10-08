import { INDEX_LOOKUP_FUNCTION } from "../compiler/constants.js";
import { ErrorMessage } from "../errors/messages.js";
import { BuiltinLambda } from "../reducer/lambda/BuiltinLambda.js";
import { makeDefinition } from "../reducer/lambda/FnDefinition.js";
import { Lambda } from "../reducer/lambda/index.js";
import { Bindings } from "../reducer/Stack.js";
import { ImmutableMap } from "../utility/immutable.js";
import { Value } from "../value/index.js";
import { vLambda } from "../value/vLambda.js";
import { frAny } from "./FrType.js";
import { makeNumbericConstants } from "./numericConstants.js";
import { getRegistry, makeSquiggleBindings } from "./registry/index.js";
import { makeVersionConstant } from "./version.js";

function makeLookupLambda(): Lambda {
  return new BuiltinLambda(INDEX_LOOKUP_FUNCTION, [
    makeDefinition([frAny(), frAny()], frAny(), ([obj, key]) => {
      if ("get" in obj) {
        return obj.get(key);
      } else {
        throw ErrorMessage.otherError("Trying to access key on wrong value");
      }
    }),
  ]);
}

function makeStdLib(): Bindings {
  const registry = getRegistry();

  let res: Bindings = ImmutableMap<string, Value>().merge(
    // global constants
    makeNumbericConstants(),
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
