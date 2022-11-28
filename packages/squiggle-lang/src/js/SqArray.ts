import { Value } from "../value";
import { wrapValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

export class SqArray {
  constructor(private _value: Value[], public location: SqValueLocation) {}

  getValues() {
    return this._value.map((v, i) => wrapValue(v, this.location.extend(i)));
  }
}
