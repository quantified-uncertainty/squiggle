import * as RSDistributionError from "../rescript/ForTS/ForTS_Distribution/ForTS_Distribution_Error.gen";

type T = RSDistributionError.distributionError;

export class SqDistributionError {
  constructor(private _value: T) {}

  toString() {
    return RSDistributionError.toString(this._value);
  }
}
