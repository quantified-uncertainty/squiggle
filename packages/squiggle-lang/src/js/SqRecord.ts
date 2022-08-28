import * as RSRecord from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Record.gen";
import { wrapValue } from "./SqValue";

type T = RSRecord.squiggleValue_Record;

export class SqRecord {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  entries() {
    return RSRecord.getKeyValuePairs(this._value).map(
      ([k, v]) => [k, wrapValue(v)] as const
    );
  }
}
