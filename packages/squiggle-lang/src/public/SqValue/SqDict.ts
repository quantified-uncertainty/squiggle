import { ValueMap, vDict } from "../../value/index.js";

import { SqValueContext } from "../SqValueContext.js";
import { SqDictValue, SqValue, wrapValue } from "./index.js";

export class SqDict {
  constructor(
    private _value: ValueMap,
    public context?: SqValueContext
  ) {}

  entries() {
    return [...this._value.entries()].map(
      ([k, v]) =>
        [
          k,
          wrapValue(v, this.context?.extend({ type: "string", value: k })),
        ] as const
    );
  }

  get(key: string): SqValue | undefined {
    const value = this._value.get(key);
    if (value === undefined) {
      return undefined;
    }
    return wrapValue(
      value,
      this.context?.extend({ type: "string", value: key })
    );
  }

  toString() {
    return vDict(this._value).toString();
  }

  asValue() {
    return new SqDictValue(vDict(this._value), this.context);
  }
}
