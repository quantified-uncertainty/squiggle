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

  // array and record lookups
  res = res.set(
    "$_atIndex_$",
    vLambda(
      new BuiltinLambda("$_atIndex_$", (inputs) => {
        if (
          inputs.length === 2 &&
          inputs[0].type === "Array" &&
          inputs[1].type === "Number"
        ) {
          const arr = inputs[0].value;
          const index = inputs[1].value | 0; // TODO - fail on non-integer indices?
          if (index >= 0 && index < arr.length) {
            return arr[index];
          } else {
            return ErrorMessage.throw(
              REArrayIndexNotFound("Array index not found", index)
            );
          }
        } else if (
          inputs.length === 2 &&
          inputs[0].type === "Record" &&
          inputs[1].type === "String"
        ) {
          const dict = inputs[0].value;
          const index = inputs[1].value;
          return (
            dict.get(index) ??
            ErrorMessage.throw(
              RERecordPropertyNotFound("Record property not found", index)
            )
          );
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
