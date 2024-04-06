import { BaseValue } from "./BaseValue.js";

export class VNumber extends BaseValue<"Number", number> {
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

  override serialize(): number {
    return this.value;
  }

  static deserialize(value: number): VNumber {
    return new VNumber(value);
  }
}

export const vNumber = (v: number) => new VNumber(v);
