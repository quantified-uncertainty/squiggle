import { ValueMap, vRecord } from "@/value/index.js";

import { SqValueContext } from "../SqValueContext.js";
import { SqRecordValue, SqValue, wrapValue } from "./index.js";

export class SqRecord {
  constructor(private _value: ValueMap, public context?: SqValueContext) {}

  entries() {
    return [...this._value.entries()].map(
      ([k, v]) => [k, wrapValue(v, this.context?.extend(k))] as const
    );
  }

  get(key: string): SqValue | undefined {
    const value = this._value.get(key);
    if (value === undefined) {
      return undefined;
    }
    return wrapValue(value, this.context?.extend(key));
  }

  toString() {
    return vRecord(this._value).toString();
  }

  asValue() {
    return new SqRecordValue(vRecord(this._value), this.context);
  }
}
