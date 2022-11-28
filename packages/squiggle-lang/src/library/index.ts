import * as Namespace from "../reducer/Namespace";
import * as Lambda from "../reducer/Lambda";
import * as IError from "../reducer/IError";
import { vLambda } from "../value";
import * as RSResult from "../rsResult";
import { makeMathConstants } from "./math";
import { makeVersionConstant } from "./version";
import * as registry from "./registry";

const makeStdLib = (): Namespace.Namespace => {
  let res = Namespace.make();

  // constants
  res = Namespace.mergeFrom(res, makeMathConstants());
  res = Namespace.mergeFrom(res, makeVersionConstant());

  // array and record lookups
  res = Namespace.set(
    res,
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
    res = Namespace.set(res, name, vLambda(lambda));
  }

  // bind the entire FunctionRegistry

  for (const name of registry.allNames()) {
    res = Namespace.set(
      res,
      name,
      vLambda(
        Lambda.makeFFILambda(name, (args, context, reducer) => {
          const result = registry.call(name, args, context, reducer);
          if (result.TAG === RSResult.E.Ok) {
            return result._0;
          } else {
            return IError.Message.throw(result._0);
          }
        })
      )
    );
  }

  return res;
};

export const stdLib = makeStdLib();
