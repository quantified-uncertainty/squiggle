import { tNumber } from "../types/TNumber.js";
import { Type } from "../types/Type.js";
import { Value } from "../value/index.js";
import { Scale } from "../value/VScale.js";
import { BaseDomain } from "./BaseDomain.js";
import { assertCorrectType, assertWithinBounds } from "./utils.js";

export class NumericRangeDomain extends BaseDomain<number> {
  readonly kind = "NumericRange";
  readonly type: Type<number>; // can't initialize early because of circular dependency

  constructor(
    public min: number,
    public max: number
  ) {
    super();
    this.type = tNumber;
  }

  toString() {
    return `Number.rangeDomain(${this.min}, ${this.max})`;
  }

  validateValue(value: Value) {
    assertCorrectType(value, "Number");
    assertWithinBounds(this.min, this.max, value.value, this);
  }

  isEqual(other: NumericRangeDomain) {
    return this.min === other.min && this.max === other.max;
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "linear" },
      min: this.min,
      max: this.max,
    };
  }
}
