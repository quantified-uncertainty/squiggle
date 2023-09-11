import { Value } from "../../value/index.js";

import { SqValueContext } from "../SqValueContext.js";
import { wrapValue } from "./index.js";

export class SqArray {
  constructor(
    private _value: Value[],
    public context?: SqValueContext
  ) {}

  getValues() {
    return this._value.map((v, i) =>
      wrapValue(v, this.context?.extend({ type: "number", value: i }))
    );
  }
}
