import { Env } from "../../dist/env.js";
import { IRuntimeError } from "../../errors/IError.js";
import { getStdLib } from "../../library/index.js";
import { FRType } from "../../library/registry/frTypes.js";
import { createContext } from "../../reducer/context.js";
import { Lambda } from "../../reducer/lambda.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { SqError, SqOtherError, SqRuntimeError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";
import { SqDomain, wrapDomain } from "./SqDomain.js";

export type SqLambdaParameter = {
  name: string;
  domain?: SqDomain;
  typeName?: string;
  type?: FRType<any>;
};

type SqLambdaSignature = {
  inputs: SqLambdaParameter[];
  outputType?: FRType<any>;
};

function lambdaToSqLambdaSignatures(lambda: Lambda): SqLambdaSignature[] {
  switch (lambda.type) {
    case "UserDefinedLambda":
      return [
        {
          inputs: lambda.parameters.map((p) => {
            return {
              name: p.name,
              domain: p.domain ? wrapDomain(p.domain.value) : undefined,
              typeName: p.type?.getName() || undefined,
              type: p.type,
            };
          }),
          outputType: lambda.outputType,
        },
      ];
    case "BuiltinLambda":
      return lambda._definitions.map((def) => ({
        inputs: def.inputs.map((p, index) => ({
          name: index.toString(),
          domain: undefined,
          typeName: p.getName(),
          type: p,
        })),
        output: def.output,
      }));
  }
}

export class SqLambda {
  constructor(
    public _value: Lambda, // public because of SqFnPlot.create
    public context?: SqValueContext
  ) {}

  static createFromStdlibName(name: string) {
    const value = getStdLib().get(name);
    if (!value) {
      throw new Error(`Name ${name} not found in stdlib`);
    }
    if (value.type !== "Lambda") {
      throw new Error(`Stdlib value ${name} is not a function`);
    }
    return new SqLambda(value.value);
  }

  get type() {
    return this._value.type;
  }

  parameterCounts() {
    return this._value.parameterCounts();
  }

  signatures(): SqLambdaSignature[] {
    return lambdaToSqLambdaSignatures(this._value);
  }

  call(args: SqValue[], env?: Env): result<SqValue, SqError> {
    if (!env) {
      if (!this.context) {
        return Result.Err(
          new SqOtherError(
            "Programmatically constructed lambda call requires env argument"
          )
        );
      }
      // default to project environment that created this lambda
      env = this.context.project.getEnvironment();
    }
    const rawArgs = args.map((arg) => arg._value);
    try {
      // TODO - obtain correct context from project
      const value = this._value.call(rawArgs, createContext(env));
      return Result.Ok(wrapValue(value));
    } catch (e) {
      return Result.Err(new SqRuntimeError(IRuntimeError.fromException(e)));
    }
  }

  toString() {
    return this._value.toString();
  }

  parameterString() {
    return this._value.parameterString();
  }
}
