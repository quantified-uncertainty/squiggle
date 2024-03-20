import { Env } from "../../dist/env.js";
import { Reducer } from "../../reducer/Reducer.js";
import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { Specification } from "../../value/VSpecification.js";
import { SqError, SqRuntimeError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePathEdge } from "../SqValuePath.js";
import { SqValue, wrapValue } from "./index.js";

export class SqSpecification {
  constructor(
    private _value: Specification,
    public context?: SqValueContext
  ) {}

  get title(): string | undefined {
    return this._value.title;
  }

  get description(): string | undefined {
    return this._value.description;
  }

  validate(subvalue: SqValue, env: Env): result<SqValue, SqError> {
    const reducer = new Reducer(env);
    const newContext = this.context?.extend(SqValuePathEdge.fromCalculator());

    try {
      const value = reducer.call(this._value.validate, [subvalue._value]);
      return Result.Ok(wrapValue(value, newContext));
    } catch (e) {
      return Result.Err(
        new SqRuntimeError(reducer.errorFromException(e), this.context?.project)
      );
    }
  }
}
