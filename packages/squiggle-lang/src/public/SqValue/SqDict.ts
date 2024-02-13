import { VDict } from "../../value/VDict.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqValuePathEdge } from "../SqValuePath.js";
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
          wrapValue(v, this.context?.extend(SqValuePathEdge.fromKey(key))),
        ] as const
    );
  }

  values(): SqValue[] {
    return this.entries().map(([, v]) => v);
  }

  get(key: string): SqValue | undefined {
    const value = this._value.safeGet(key);
    if (value === undefined) {
      return;
    }
    return wrapValue(value, this.context?.extend(SqValuePathEdge.fromKey(key)));
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
