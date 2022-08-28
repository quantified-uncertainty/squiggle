import * as RSDistributionError from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_Error.gen";

type T = RSDistributionError.distributionError;

export class SqDistributionError {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  toString() {
    return RSDistributionError.toString(this._value);
  }
}
