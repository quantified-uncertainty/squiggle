import * as RSArray from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Array.gen";
import { wrapValue } from "./SqValue";

type T = RSArray.squiggleValue_Array;

export class SqArray {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  getValues() {
    return RSArray.getValues(this._value).map(wrapValue);
  }
}
