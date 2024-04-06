import { SDate } from "../utility/SDate.js";
import { BaseValue } from "./BaseValue.js";

export class VDate extends BaseValue<"Date", number> {
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

  override serialize() {
    return this.value.toMs();
  }

  static deserialize(value: number): VDate {
    return new VDate(SDate.fromMs(value));
  }
}

export const vDate = (v: SDate) => new VDate(v);
