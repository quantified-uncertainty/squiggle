import { INDEX_LOOKUP_FUNCTION } from "../expression/constants.js";
import { Namespace, NamespaceMap } from "../reducer/bindings.js";
import { REOther } from "../errors.js";
import { BuiltinLambda, Lambda } from "../reducer/lambda.js";
import { Value, vLambda } from "../value/index.js";

import { makeMathConstants } from "./math.js";
import { nonRegistryLambdas, registry } from "./registry/index.js";
import { makeVersionConstant } from "./version.js";

function makeLookupLambda(): Lambda {
  return new BuiltinLambda(INDEX_LOOKUP_FUNCTION, (inputs) => {
    if (inputs.length !== 2) {
      // should never happen
      throw new REOther("Index lookup internal error");
    }

    const [obj, key] = inputs;
    if ("get" in obj) {
      return obj.get(key).clone();
    } else {
      throw new REOther("Trying to access key on wrong value");
    }
  });
}

function makeStdLib(): Namespace {
  let res = NamespaceMap<string, Value>();

  // constants
  res = res.merge(makeMathConstants());
  res = res.merge(makeVersionConstant());

  // field lookups
  res = res.set(INDEX_LOOKUP_FUNCTION, vLambda(makeLookupLambda()));

  // some lambdas can't be expressed in function registry (e.g. `mx` with its variadic number of parameters)
  for (const [name, lambda] of nonRegistryLambdas) {
    res = res.set(name, vLambda(lambda));
  }

  // bind the entire FunctionRegistry
  for (const name of registry.allNames()) {
    res = res.set(name, vLambda(registry.makeLambda(name)));
  }

  return res;
}

// lazy cache
let cachedStdLib: ReturnType<typeof makeStdLib> | undefined;
export function getStdLib() {
  cachedStdLib ??= makeStdLib();
  return cachedStdLib;
}
