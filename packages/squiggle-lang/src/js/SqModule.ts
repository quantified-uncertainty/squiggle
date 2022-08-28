import * as RSModuleValue from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Module.gen";
import { SqModuleValue, wrapValue } from "./SqValue";

export class SqModule {
  _value: RSModuleValue.squiggleValue_Module;

  constructor(_value: RSModuleValue.squiggleValue_Module) {
    this._value = _value;
  }

  entries() {
    return RSModuleValue.getKeyValuePairs(this._value).map(
      ([k, v]) => [k, wrapValue(v)] as const
    );
  }

  asValue() {
    return new SqModuleValue(RSModuleValue.toSquiggleValue(this._value));
  }
}
