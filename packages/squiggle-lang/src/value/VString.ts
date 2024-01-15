import { BaseValue } from "./index.js";

export class VString extends BaseValue {
  readonly type = "String";

  constructor(public value: string) {
    super();
  }

  valueToString() {
    return JSON.stringify(this.value);
  }

  isEqual(other: VString) {
    return this.value === other.value;
  }
}

export const vString = (v: string) => new VString(v);
