import { DistError, distErrorToString } from "../dist/DistError";

export class SqDistributionError {
  constructor(private _value: DistError) {}

  toString() {
    return distErrorToString(this._value);
  }
}
