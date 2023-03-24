import { Value, vLambda } from "../value";
import { makeMathConstants } from "./math";
import { makeVersionConstant } from "./version";
import * as registry from "./registry";
import { Namespace, NamespaceMap } from "../reducer/bindings";
import { BuiltinLambda } from "../reducer/lambda";
import {
  ErrorMessage,
  REArrayIndexNotFound,
  REOther,
  RERecordPropertyNotFound,
} from "../reducer/ErrorMessage";

const makeStdLib = (): Namespace => {
  let res = NamespaceMap<string, Value>();

  // constants
  res = res.merge(makeMathConstants());
  res = res.merge(makeVersionConstant());

  // field lookups
  res = res.set(
    "$_atIndex_$",
    vLambda(
      new BuiltinLambda("$_atIndex_$", (inputs) => {
        if (inputs.length !== 2) {
          // should never happen
          return ErrorMessage.throw(REOther("$_atIndex_$ internal error"));
        }

        const [obj, key] = inputs;
        if ("get" in obj) {
          return obj.get(key);
        } else {
          return ErrorMessage.throw(
            REOther("Trying to access key on wrong value")
          );
        }
      })
    )
  );

  // some lambdas can't be expressed in function registry (e.g. `mx` with its variadic number of parameters)
  for (const [name, lambda] of registry.nonRegistryLambdas) {
    res = res.set(name, vLambda(lambda));
  }

  // bind the entire FunctionRegistry

  for (const name of registry.allNames()) {
    res = res.set(
      name,
      vLambda(
        new BuiltinLambda(name, (args, context, reducer) => {
          // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
          // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
          const result = registry.call(name, args, context, reducer);
          if (!result.ok) {
            return ErrorMessage.throw(result.value);
          }
          return result.value;
        })
      )
    );
  }

  return res;
};

export const stdLib = makeStdLib();
