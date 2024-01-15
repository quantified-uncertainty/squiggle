import { SDuration } from "../utility/SDuration.js";
import { BaseValue } from "./index.js";

export class VDuration extends BaseValue {
  readonly type = "Duration";

  override get publicName() {
    return "Time Duration";
  }

  constructor(public value: SDuration) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }

  isEqual(other: VDuration) {
    return this.value.toMs() === other.value.toMs();
  }
}

export const vDuration = (v: SDuration) => new VDuration(v);
