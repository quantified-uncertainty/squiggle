import * as RSModuleValue from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Module.gen";
import { SqModuleValue, wrapValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

export class SqModule {
  constructor(
    private _value: RSModuleValue.squiggleValue_Module,
    public location: SqValueLocation
  ) {}

  entries() {
    return RSModuleValue.getKeyValuePairs(this._value).map(
      ([k, v]) => [k, wrapValue(v, this.location.extend(k))] as const
    );
  }

  asValue() {
    return new SqModuleValue(
      RSModuleValue.toSquiggleValue(this._value),
      this.location
    );
  }

  get(k: string) {
    const v = RSModuleValue.get(this._value, k);
    return v === undefined || v === null
      ? undefined
      : wrapValue(v, this.location.extend(k));
  }
}
