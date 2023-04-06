import { Value } from "../value/index.js";
import { wrapValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export class SqArray {
  constructor(private _value: Value[], public location: SqValueLocation) {}

  getValues() {
    return this._value.map((v, i) => wrapValue(v, this.location.extend(i)));
  }
}
