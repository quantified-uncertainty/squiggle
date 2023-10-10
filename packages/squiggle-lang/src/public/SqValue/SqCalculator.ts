import { Calculator } from "../../value/index.js";
import { Env } from "../../dist/env.js";
import * as Result from "../../utility/result.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";
import { SqValue, wrapValue } from "./index.js";
export class SqCalculator {
  constructor(
    private _value: Calculator,
    public context?: SqValueContext
  ) {}

  run(_arguments: SqValue[], env: Env): Result.result<SqValue, SqError> {
    const sqLambda = new SqLambda(this._value.fn, undefined);
    const response = sqLambda.call(_arguments, env);

    const newContext =
      this.context && this.context.extend({ type: "calculator" });

    if (!newContext) {
      return Result.Err(
        new SqOtherError("Context creation for calculator failed.")
      );
    } else if (!response.ok) {
      return response;
    } else {
      return Result.Ok(wrapValue(response.value._value, newContext));
    }
  }

  get description(): string | undefined {
    return this._value.description;
  }

  get fields(): {
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
