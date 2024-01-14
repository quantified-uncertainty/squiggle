import { VDict, vString } from "../../value/index.js";
import { SqValueContext } from "../SqValueContext.js";
import { SqDictValue, SqValue, wrapValue } from "./index.js";

export class SqDict {
  constructor(
    private _value: VDict,
    public context?: SqValueContext
  ) {}

  entries(): [string, SqValue][] {
    return [...this._value.value.entries()].map(
      ([k, v]) =>
        [
          k,
          wrapValue(v, this.context?.extend({ type: "string", value: k })),
        ] as const
    );
  }

  get(key: string): SqValue | undefined {
    const value = this._value.get(vString(key));
    if (value === undefined) {
      return undefined;
    }
    return wrapValue(
      value,
      this.context?.extend({ type: "string", value: key })
    );
  }

  toString() {
    return this._value.valueToString();
  }

  asValue() {
    return new SqDictValue(this._value, this.context);
  }
}
