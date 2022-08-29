import * as RSErrorValue from "../rescript/ForTS/ForTS_Reducer_ErrorValue.gen";

export class SqError {
  constructor(private _value: RSErrorValue.reducerErrorValue) {}

  toString() {
    return RSErrorValue.toString(this._value);
  }
}
