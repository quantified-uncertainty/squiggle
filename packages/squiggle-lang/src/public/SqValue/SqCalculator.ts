import { Calculator } from "../../value/index.js";
import { Env } from "../../dist/env.js";
import * as Result from "../../utility/result.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";
import { SqValue, wrapValue } from "./index.js";
import { Lambda } from "../../reducer/lambda.js";

const wrapFn = ({ fn }: { fn: Lambda }): SqLambda => {
  return new SqLambda(fn, undefined);
};

export class SqCalculator {
  constructor(private _value: Calculator, public context?: SqValueContext) {}

  run(items: SqValue[], env: Env): Result.result<SqValue, SqError> {
    const response = wrapFn({ fn: this._value.fn }).call(items, env);
    const context = this.context;

    const newContext: SqValueContext | undefined =
      context && context.extend({ type: "calculator" });

    if (response.ok && context) {
      return Result.Ok(wrapValue(response.value._value, newContext));
    } else if (response.ok) {
      return Result.Err(new SqOtherError("Context creation for table failed."));
    } else {
      return response;
    }
  }

  get description(): string | undefined {
    return this._value.description;
  }

  get parameterNames(): string[] {
    return this._value.fn.getParameterNames();
  }

  get rows(): {
    name: string;
    default: string;
    description?: string;
  }[] {
    return this._value.fields.map((x) => ({
      name: x.name,
      default: x.default,
      description: x.description,
    }));
  }
}
