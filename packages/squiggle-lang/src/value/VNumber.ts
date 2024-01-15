import { BaseValue } from "./index.js";

export class VNumber extends BaseValue {
  readonly type = "Number";

  constructor(public value: number) {
    super();
  }

  valueToString() {
    return String(this.value);
  }

  isEqual(other: VNumber) {
    return this.value === other.value;
  }
}

export const vNumber = (v: number) => new VNumber(v);
