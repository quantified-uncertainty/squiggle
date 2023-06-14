import { INDEX_LOOKUP_FUNCTION } from "../expression/constants.js";
import { Namespace, NamespaceMap } from "../reducer/bindings.js";
import { ErrorMessage, REOther } from "../reducer/ErrorMessage.js";
import { BuiltinLambda, Lambda } from "../reducer/lambda.js";
import { Value, vLambda } from "../value/index.js";

import { makeMathConstants } from "./math.js";
import { nonRegistryLambdas, registry } from "./registry/index.js";
import { makeVersionConstant } from "./version.js";

function makeLookupLambda(): Lambda {
  return new BuiltinLambda(INDEX_LOOKUP_FUNCTION, (inputs) => {
    if (inputs.length !== 2) {
      // should never happen
      return ErrorMessage.throw(REOther("Index lookup internal error"));
    }

    const [obj, key] = inputs;
    if ("get" in obj) {
      return obj.get(key);
    } else {
      return ErrorMessage.throw(REOther("Trying to access key on wrong value"));
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

// We do this on import, because stdLib is expensive and we want to do it only once.
// Might be better to build it lazily on demand and cache.
export const stdLib = makeStdLib();
