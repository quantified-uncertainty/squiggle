import * as RSRecord from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_Record.gen";
import { AbstractSquiggleValue, wrapSquiggleValue } from "./SquiggleValue";

type T = RSRecord.squiggleValue_Record;

export class Record {
  _value: T;

  constructor(_value: T) {
    this._value = _value;
  }

  entries() {
    return RSRecord.getKeyValuePairs(this._value).map(
      ([k, v]) => [k, wrapSquiggleValue(v)] as const
    );
  }
}
