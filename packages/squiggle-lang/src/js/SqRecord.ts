import * as RSRecord from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Record.gen";
import { wrapValue } from "./SqValue";
import { SqValueLocation } from "./SqValueLocation";

type T = RSRecord.squiggleValue_Record;

export class SqRecord {
  constructor(private _value: T, public location: SqValueLocation) {}

  entries() {
    return RSRecord.getKeyValuePairs(this._value).map(
      ([k, v]) => [k, wrapValue(v, this.location.extend(k))] as const
    );
  }

  toString() {
    return RSRecord.toString(this._value);
  }
}
