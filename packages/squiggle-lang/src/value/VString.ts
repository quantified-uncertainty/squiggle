import { BaseValue } from "./BaseValue.js";

export class VString extends BaseValue<"String", string> {
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

  serializePayload() {
    return this.value;
  }

  static deserialize(value: string) {
    return new VString(value);
  }
}

export const vString = (v: string) => new VString(v);
