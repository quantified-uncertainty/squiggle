import { REArgumentError, REDomainError } from "../errors/messages.js";
import { SDate } from "../utility/SDate.js";
import { Scale, Value, VDate, VNumber } from "./index.js";

function _assertCorrectType(value: Value, expectedType: string) {
  if (value.type !== expectedType) {
    throw new REDomainError(
      `Parameter ${value.toString()}, of type ${
        value.type
      }, must be a ${expectedType}`
    );
  }
}

function _assertWithinBounds(
  min: number,
  max: number,
  value: number,
  domain: Domain,
  format: (n: number) => string = (n) => n.toString()
) {
  if (value < min || value > max) {
    throw new REDomainError(
      `Parameter ${format(value)} must be in domain ${domain.toString()}`
    );
  }
}

function _assertMinLessThanMax(min: number, max: number) {
  if (min >= max) {
    throw new REArgumentError(
      `The range minimum (${min}) must be lower than the range maximum (${max})`
    );
  }
}

abstract class BaseDomain {
  abstract type: string;
  abstract valueType: string;

  abstract toString(): string;

  abstract validateValue(value: Value): void;

  abstract get minAsNumber(): number;
  abstract get maxAsNumber(): number;
}

export class NumericRangeDomain extends BaseDomain {
  readonly type = "NumericRange";
  readonly valueType = "Number";

  constructor(
    public min: number,
    public max: number
  ) {
    super();
  }

  toString() {
    return `Number.rangeDomain({ min: ${this.min}, max: ${this.max} })`;
  }

  validateValue(value: Value) {
    _assertCorrectType(value, "Number");
    _assertWithinBounds(this.min, this.max, (value as VNumber).value, this);
  }

  isEqual(other: NumericRangeDomain) {
    return this.min === other.min && this.max === other.max;
  }

  get minAsNumber() {
    return this.min;
  }

  get maxAsNumber() {
    return this.max;
  }

  toDefaultScale(): Scale {
    return {
      type: "linear",
      min: this.min,
      max: this.max,
    };
  }
}

export class DateRangeDomain extends BaseDomain {
  readonly type = "DateRange";
  readonly valueType = "Date";

  constructor(
    public min: SDate,
    public max: SDate
  ) {
    super();
  }

  toString() {
    return `Date.rangeDomain({ min: ${this.min.toString()}, max: ${this.max.toString()} })`;
  }

  validateValue(value: Value) {
    _assertCorrectType(value, "Date");
    _assertWithinBounds(
      this.min.toMs(),
      this.max.toMs(),
      (value as VDate).value.toMs(),
      this,
      (n) => SDate.fromMs(n).toString()
    );
  }

  isEqual(other: DateRangeDomain) {
    return this.min === other.min && this.max === other.max;
  }

  get minAsNumber() {
    return this.min.toMs();
  }

  get maxAsNumber() {
    return this.max.toMs();
  }

  toDefaultScale(): Scale {
    return {
      type: "date",
      min: this.min.toMs(),
      max: this.max.toMs(),
    };
  }
}

export type Domain = NumericRangeDomain | DateRangeDomain;

export function annotationToDomain(value: Value): Domain {
  if (value.type === "Domain") {
    return value.value;
  }
  if (value.type !== "Array") {
    throw new REArgumentError("Only array domains are supported");
  }
  if (value.value.length !== 2) {
    throw new REArgumentError("Expected two-value array");
  }
  const [min, max] = value.value;
  if (min.type !== "Number" && min.type !== "Date") {
    throw new REArgumentError("Min value is not a number or date");
  }
  if (max.type !== "Number" && max.type !== "Date") {
    throw new REArgumentError("Max value is not a number or date");
  }

  if (min.type === "Date" && max.type === "Date") {
    _assertMinLessThanMax(min.value.toMs(), max.value.toMs());
    return new DateRangeDomain(min.value, max.value);
  } else if (min.type === "Number" && max.type === "Number") {
    _assertMinLessThanMax(min.value, max.value);
    return new NumericRangeDomain(min.value, max.value);
  } else {
    throw new REArgumentError(
      `The range minimum and maximum must be of the same type. Got ${min.type} and ${max.type}`
    );
  }
}
