import { Env } from "../../dists/env.js";
import { getStdLib } from "../../library/index.js";
import { Lambda } from "../../reducer/lambda.js";
import { Reducer } from "../../reducer/Reducer.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { Value } from "../../value/index.js";
import { SqError, SqOtherError, SqRuntimeError } from "../SqError.js";
import { SqProject } from "../SqProject/index.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue, wrapValue } from "./index.js";
import { SqDomain, wrapDomain } from "./SqDomain.js";

export type SqLambdaParameter = {
  name: string;
  domain?: SqDomain;
  typeName?: string;
};

type SqLambdaSignature = SqLambdaParameter[];

function lambdaToSqLambdaSignatures(lambda: Lambda): SqLambdaSignature[] {
  switch (lambda.type) {
    case "UserDefinedLambda":
      return [
        lambda.parameters.map((param) => {
          return {
            name: param.name,
            domain: param.domain ? wrapDomain(param.domain.value) : undefined,
          };
        }),
      ];
    case "BuiltinLambda":
      return lambda.signatures().map((def) =>
        def.map((p, index) => ({
          name: index.toString(),
          domain: undefined,
          typeName: p.display(),
        }))
      );
  }
}

export function runLambda(
  lambda: Lambda,
  values: Value[],
  env: Env,
  project?: SqProject
): result<SqValue, SqError> {
  const reducer = new Reducer(env);
  try {
    const value = reducer.call(lambda, values);
    return Result.Ok(wrapValue(value) as SqValue);
  } catch (e) {
    return Result.Err(
      new SqRuntimeError(reducer.errorFromException(e), project)
    );
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

    // TODO - reuse more parts of the project's primary reducer?
    return runLambda(this._value, rawArgs, env, this.context?.project);
  }

  toString() {
    return this._value.toString();
  }

  parameterString() {
    return this._value.parameterString();
  }
}
