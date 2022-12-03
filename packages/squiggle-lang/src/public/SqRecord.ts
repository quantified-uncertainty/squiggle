import { ValueMap, vRecord } from "../value";
import { SqRecordValue, wrapValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

export class SqRecord {
  constructor(private _value: ValueMap, public location: SqValueLocation) {}

  entries() {
    return [...this._value.entries()].map(
      ([k, v]) => [k, wrapValue(v, this.location.extend(k))] as const
    );
  }

  toString() {
    return vRecord(this._value).toString();
  }

  asValue() {
    return new SqRecordValue(vRecord(this._value), this.location);
  }
}
