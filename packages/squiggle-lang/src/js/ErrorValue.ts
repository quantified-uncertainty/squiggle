import * as RSErrorValue from "../rescript/ForTS/ForTS_Reducer_ErrorValue.gen";

export class ErrorValue {
  _value: RSErrorValue.reducerErrorValue;

  constructor(_value: RSErrorValue.reducerErrorValue) {
    this._value = _value;
  }

  toString() {
    return RSErrorValue.toString(this._value);
  }
}
