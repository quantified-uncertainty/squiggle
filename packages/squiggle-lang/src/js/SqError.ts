import * as RSErrorValue from "../rescript/ForTS/ForTS_Reducer_ErrorValue.gen";

export class SqError {
  constructor(private _value: RSErrorValue.reducerError) {}

  toString() {
    return RSErrorValue.toString(this._value);
  }

  static createOtherError(v: string) {
    return new SqError(RSErrorValue.createOtherError(v));
  }
}
