import { dateToMs } from "../../utility/DateTime.js";
import {
  DateRangeDomain,
  Domain,
  NumericRangeDomain,
} from "../../value/domain.js";
import { SqDateScale, SqLinearScale } from "./SqScale.js";

export function wrapDomain(value: Domain) {
  switch (value.type) {
    case "NumericRange":
      return new SqNumericRangeDomain(value);
    case "DateRange":
      return new SqDateRangeDomain(value);
    default:
      throw new Error(`Unknown type`);
  }
}

// Domain internals are not exposed yet
abstract class SqAbstractDomain<T extends Domain["type"]> {
  abstract tag: T;
}

class SqNumericRangeDomain extends SqAbstractDomain<"NumericRange"> {
  tag = "NumericRange" as const;

  constructor(public _value: NumericRangeDomain) {
    super();
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  toDefaultScale() {
    return new SqLinearScale({
      type: "linear",
      min: this.min,
      max: this.max,
    });
  }
}
class SqDateRangeDomain extends SqAbstractDomain<"DateRange"> {
  tag = "DateRange" as const;

  constructor(public _value: DateRangeDomain) {
    super();
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  toDefaultScale() {
    return new SqDateScale({
      type: "date",
      min: dateToMs(this.min),
      max: dateToMs(this.max),
    });
  }
}

export type SqDomain = ReturnType<typeof wrapDomain>;
