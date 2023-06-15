import { Env } from "../dist/env.js";
import { stdLib } from "../library/index.js";
import { registry } from "../library/registry/index.js";
import { IError } from "../reducer/IError.js";
import { createContext } from "../reducer/context.js";
import { evaluate } from "../reducer/index.js";
import { Lambda } from "../reducer/lambda.js";
import * as Result from "../utility/result.js";
import { result } from "../utility/result.js";
import { SqError } from "./SqError.js";
import { SqValue, wrapValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export class SqLambda {
  constructor(
    public _value: Lambda, // public because of SqFnPlot.create
    public location?: SqValueLocation
  ) {}

  static createFromStdlibName(name: string) {
    return new SqLambda(registry.makeLambda(name));
  }

  parameters() {
    return this._value.getParameters();
  }

  call(args: SqValue[], env?: Env): result<SqValue, SqError> {
    if (!env) {
      if (!this.location) {
        return Result.Err(
          SqError.createOtherError(
            "Programmatically constructed lambda call requires env argument"
          )
        );
      }
      // default to project environment that created this lambda
      env = this.location.project.getEnvironment();
    }
    const rawArgs = args.map((arg) => arg._value);
    try {
      const value = this._value.call(
        rawArgs,
        createContext(stdLib, env),
        evaluate
      );
      return Result.Ok(wrapValue(value));
    } catch (e) {
      return Result.Err(new SqError(IError.fromException(e)));
    }
  }

  toString() {
    return this._value.toString();
  }
}
