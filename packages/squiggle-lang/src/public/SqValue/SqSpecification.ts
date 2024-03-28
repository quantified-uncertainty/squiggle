import * as Result from "../../utility/result.js";
import { result } from "../../utility/result.js";
import { Specification } from "../../value/VSpecification.js";
import { SqError, SqOtherError } from "../SqError.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValue } from "./index.js";
import { runLambda } from "./SqLambda.js";

export class SqSpecification {
  constructor(
    private _value: Specification,
    public context?: SqValueContext
  ) {}

  get name(): string | undefined {
    return this._value.name;
  }

  get documentation(): string | undefined {
    return this._value.documentation;
  }

  // TODO: We might want to allow this to optionally take in a custom environment.
  // This code was mostly taken from SqLambda.ts.
  validate(subvalue: SqValue): result<SqValue, SqError> {
    if (!this.context) {
      return Result.Err(new SqOtherError("No context for specification"));
    }
    const env = this.context.project.getEnvironment();
    return runLambda(
      this._value.validate,
      [subvalue._value],
      env,
      this.context.project
    );
  }
}
