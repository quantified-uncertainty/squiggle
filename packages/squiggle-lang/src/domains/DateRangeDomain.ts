import { tDate } from "../types/TDate.js";
import { Type } from "../types/Type.js";
import { SDate } from "../utility/SDate.js";
import { Value } from "../value/index.js";
import { Scale } from "../value/VScale.js";
import { BaseDomain } from "./BaseDomain.js";
import { assertCorrectType, assertWithinBounds } from "./utils.js";

export class DateRangeDomain extends BaseDomain {
  readonly kind = "DateRange";
  readonly type: Type<SDate>; // can't initialize early because of circular dependency

  constructor(
    public min: SDate,
    public max: SDate
  ) {
    super();
    this.type = tDate;
  }

  toString() {
    return `Date.rangeDomain(${this.min.toString()}, ${this.max.toString()})`;
  }

  validateValue(value: Value) {
    assertCorrectType(value, "Date");
    assertWithinBounds(
      this.min.toMs(),
      this.max.toMs(),
      value.value.toMs(),
      this,
      (n) => SDate.fromMs(n).toString()
    );
  }

  isEqual(other: DateRangeDomain) {
    return this.min === other.min && this.max === other.max;
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "date" },
      min: this.min.toMs(),
      max: this.max.toMs(),
    };
  }
}
