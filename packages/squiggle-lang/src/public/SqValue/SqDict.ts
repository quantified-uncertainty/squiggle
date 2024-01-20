import { VDict } from "../../value/VDict.js";
import { vString } from "../../value/VString.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqPathItem } from "../SqValuePath.js";
import { SqDictValue, SqValue, wrapValue } from "./index.js";

export class SqDict {
  constructor(
    private _value: VDict,
    public context?: SqValueContext
  ) {}

  entries(): [string, SqValue][] {
    return [...this._value.value.entries()].map(
      ([key, v]) =>
        [
          key,
          wrapValue(v, this.context?.extend(SqPathItem.fromDictKey(key))),
        ] as const
    );
  }

  get(key: string): SqValue | undefined {
    const value = this._value.get(vString(key));
    if (value === undefined) {
      return undefined;
    }
    return wrapValue(value, this.context?.extend(SqPathItem.fromDictKey(key)));
  }

  toString() {
    return this._value.toString();
  }

  asValue() {
    return new SqDictValue(this._value, this.context);
  }

  isEmpty() {
    return this._value.isEmpty();
  }

  size() {
    return this._value.size();
  }
}
