import * as RSError from "../rescript/SqError.gen";

export type SqLocation = RSError.location;

export class SqError {
  constructor(private _value: RSError.t) {}

  toString() {
    return RSError.toString(this._value);
  }

  toStringWithStackTrace() {
    return RSError.toStringWithStackTrace(this._value);
  }

  static createOtherError(v: string) {
    return new SqError(RSError.createOtherError(v));
  }

  toLocationArray() {
    const stackTrace = RSError.getStackTrace(this._value);

    return stackTrace ? RSError.StackTrace.toLocationArray(stackTrace) : [];
  }

  toLocation() {
    return RSError.getLocation(this._value);
  }
}
