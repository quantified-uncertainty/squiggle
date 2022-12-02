import * as Lambda from "../reducer/Lambda";
import * as IError from "../reducer/IError";
import { Value, vLambda } from "../value";
import { makeMathConstants } from "./math";
import { makeVersionConstant } from "./version";
import * as registry from "./registry";
import { Namespace, NamespaceMap } from "../reducer/bindings";

const makeStdLib = (): Namespace => {
  let res = NamespaceMap<string, Value>();

  // constants
  res = res.merge(makeMathConstants());
  res = res.merge(makeVersionConstant());

  // array and record lookups
  res = res.set(
    "$_atIndex_$",
    vLambda(
      Lambda.makeFFILambda("$_atIndex_$", (inputs) => {
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
            return IError.Message.throw(
              IError.REArrayIndexNotFound("Array index not found", index)
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
            IError.Message.throw(
              IError.RERecordPropertyNotFound(
                "Record property not found",
                index
              )
            )
          );
        } else {
          return IError.Message.throw(
            IError.REOther("Trying to access key on wrong value")
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
        Lambda.makeFFILambda(name, (args, context, reducer) => {
          const result = registry.call(name, args, context, reducer);
          if (!result.ok) {
            return IError.Message.throw(result.value);
          }
          return result.value;
        })
      )
    );
  }

  return res;
};

export const stdLib = makeStdLib();
