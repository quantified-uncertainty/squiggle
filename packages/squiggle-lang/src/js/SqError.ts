import * as RSErrorValue from "../rescript/ForTS/ForTS_Reducer_ErrorValue.gen";

export class SqError {
  constructor(private _value: RSErrorValue.reducerErrorValue) {}

  toString() {
    return RSErrorValue.toString(this._value);
  }

  static createTodoError(v: string) {
    return new SqError(RSErrorValue.createTodoError(v));
  }

  static createOtherError(v: string) {
    return new SqError(RSErrorValue.createOtherError(v));
  }
}
