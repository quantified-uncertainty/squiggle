import { Specification } from "../../value/VSpecification.js";
import { SqValueContext } from "../SqValueContext.js";

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
}
