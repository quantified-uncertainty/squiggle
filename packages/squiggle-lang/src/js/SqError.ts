import * as RSErrorValue from "../rescript/ForTS/ForTS_Reducer_ErrorValue.gen";

export class SqError {
  constructor(private _value: RSErrorValue.reducerErrorValueWithSource) {}

  toString() {
    return RSErrorValue.toString(this._value);
  }

  getSource() {
    return RSErrorValue.getSource(this._value);
  }
}
