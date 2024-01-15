import { SDate } from "../utility/SDate.js";
import { BaseValue } from "./index.js";

export class VDate extends BaseValue {
  readonly type = "Date";

  constructor(public value: SDate) {
    super();
  }

  valueToString() {
    return this.value.toString();
  }

  isEqual(other: VDate) {
    return this.value.isEqual(other.value);
  }
}

export const vDate = (v: SDate) => new VDate(v);
