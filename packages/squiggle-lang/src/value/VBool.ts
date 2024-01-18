import { BaseValue } from "./index.js";

export class VBool extends BaseValue {
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
}
export const vBool = (v: boolean) => new VBool(v);
