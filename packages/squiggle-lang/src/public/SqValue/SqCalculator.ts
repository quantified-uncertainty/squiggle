import { Calculator } from "../../value/index.js";
import { Env } from "../../dist/env.js";
import * as Result from "../../utility/result.js";

import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqLambda } from "./SqLambda.js";
import { SqValue, wrapValue } from "./index.js";
import { SqInput, wrapInput } from "./SqInput.js";
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

  get title(): string | undefined {
    return this._value.title;
  }

  get description(): string | undefined {
    return this._value.description;
  }

  get autorun(): boolean {
    return this._value.autorun;
  }

  get sampleCount(): number | undefined {
    return this._value.sampleCount;
  }

  // This function is used to determine if a calculator has changed.
  // It's obviously not perfect - it doesn't capture changes within the calculator function, but this would be much more complicated.

  get hashString(): string {
    const rowData = JSON.stringify(this._value.inputs);
    const paramData = this._value.fn.toString() || "";
    return (
      rowData +
      paramData +
      this._value.description +
      this._value.title +
      this._value.autorun +
      this._value.sampleCount
    );
  }

  get inputs(): SqInput[] {
    return this._value.inputs.map(wrapInput);
  }
}
