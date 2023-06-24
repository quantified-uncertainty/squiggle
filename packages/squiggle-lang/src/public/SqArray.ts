import { Value } from "../value/index.js";
import { wrapValue } from "./SqValue.js";
import { SqValuePath } from "./SqValuePath.js";

export class SqArray {
  constructor(private _value: Value[], public path?: SqValuePath) {}

  getValues() {
    return this._value.map((v, i) => wrapValue(v, this.path?.extend(i)));
  }
}
