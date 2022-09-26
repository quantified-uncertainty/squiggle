import * as RSError from "../rescript/ForTS/ForTS_SqError.gen";

export class SqError {
  constructor(private _value: RSError.error) {}

  toString() {
    return RSError.toString(this._value);
  }

  static createOtherError(v: string) {
    return new SqError(RSError.createOtherError(v));
  }
}
