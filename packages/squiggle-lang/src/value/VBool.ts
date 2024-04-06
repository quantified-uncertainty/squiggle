import { BaseValue } from "./BaseValue.js";

export class VBool extends BaseValue<"Bool", boolean> {
  readonly type = "Bool";

  override get publicName() {
    return "Boolean";
  }

  constructor(public value: boolean) {
    super();
  }

  valueToString() {
    return String(this.value);
  }

  isEqual(other: VBool) {
    return this.value === other.value;
  }

  override serialize() {
    return this.value;
  }

  static deserialize(value: boolean) {
    return new VBool(value);
  }
}

export const vBool = (v: boolean) => new VBool(v);
