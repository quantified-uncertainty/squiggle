import * as RSArray from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Array.gen";
import { wrapValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

type T = RSArray.squiggleValue_Array;

export class SqArray {
  constructor(private _value: T, public location: SqValueLocation) {}

  getValues() {
    return RSArray.getValues(this._value).map((v, i) =>
      wrapValue(v, this.location.extend(i))
    );
  }
}
