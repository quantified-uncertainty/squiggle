import { DistError, distErrorToString } from "../../../dists/DistError.js";

export class SqDistributionError {
  constructor(private _value: DistError) {}

  toString() {
    return distErrorToString(this._value);
  }
}
