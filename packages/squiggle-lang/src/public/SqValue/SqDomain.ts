import { TDateRange } from "../../types/TDateRange.js";
import { TNumberRange } from "../../types/TNumberRange.js";
import { Type } from "../../types/Type.js";
import { SqDateValue, SqNumberValue } from "./index.js";
import { SqScale } from "./SqScale.js";

export function wrapDomain(value: Type) {
  if (value instanceof TNumberRange) {
    return new SqNumericRangeDomain(value);
  }
  if (value instanceof TDateRange) {
    return new SqDateRangeDomain(value);
  }
  return new SqTypeDomain(value);
}

// Domain internals are not exposed yet
abstract class SqAbstractDomain<T extends string> {
  abstract tag: T;
}

export class SqNumericRangeDomain extends SqAbstractDomain<"NumericRange"> {
  tag = "NumericRange" as const;

  constructor(public _value: TNumberRange) {
    super();
  }

  //A simple alternative to making a Domain object and pass that in.
  static fromMinMax(min: number, max: number) {
    return new this(new TNumberRange(min, max));
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  get minValue() {
    return SqNumberValue.create(this._value.min);
  }

  get maxValue() {
    return SqNumberValue.create(this._value.max);
  }

  toDefaultScale() {
    return new SqScale(this._value.toDefaultScale());
  }
}
export class SqDateRangeDomain extends SqAbstractDomain<"DateRange"> {
  tag = "DateRange" as const;

  constructor(public _value: TDateRange) {
    super();
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  get minValue() {
    return SqDateValue.create(this._value.min);
  }

  get maxValue() {
    return SqDateValue.create(this._value.max);
  }

  toDefaultScale() {
    return new SqScale(this._value.toDefaultScale());
  }
}

export class SqTypeDomain extends SqAbstractDomain<"Type"> {
  tag = "Type" as const;

  constructor(public _value: Type) {
    super();
  }
}

export type SqDomain = ReturnType<typeof wrapDomain>;
