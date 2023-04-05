import { ValueMap, vRecord } from "../value/index.js";
import { SqRecordValue, SqValue, wrapValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export class SqRecord {
  constructor(private _value: ValueMap, public location: SqValueLocation) {}

  entries() {
    return [...this._value.entries()].map(
      ([k, v]) => [k, wrapValue(v, this.location.extend(k))] as const
    );
  }

  get(key: string): SqValue | undefined {
    const value = this._value.get(key);
    if (value === undefined) {
      return undefined;
    }
    return wrapValue(value, this.location.extend(key));
  }

  toString() {
    return vRecord(this._value).toString();
  }

  asValue() {
    return new SqRecordValue(vRecord(this._value), this.location);
  }
}
