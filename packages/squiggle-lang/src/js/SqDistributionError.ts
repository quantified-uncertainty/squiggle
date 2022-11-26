import { DistError, distErrorToString } from "../Dist/DistError";

export class SqDistributionError {
  constructor(private _value: DistError) {}

  toString() {
    return distErrorToString(this._value);
  }
}
