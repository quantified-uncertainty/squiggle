import * as RSType from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Type.gen";

type T = RSType.squiggleValue_Type;

export class Type {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }
}
