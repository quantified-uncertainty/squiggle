import { BaseDist } from "../dist/BaseDist.js";
import { BaseValue } from "./index.js";

export class VDist extends BaseValue {
  readonly type = "Dist";

  override get publicName() {
    return "Distribution";
  }

  constructor(public value: BaseDist) {
    super();
  }
  valueToString() {
    return this.value.toString();
  }
  isEqual(other: VDist) {
    return this.value.isEqual(other.value);
  }
}
export const vDist = (v: BaseDist) => new VDist(v);
