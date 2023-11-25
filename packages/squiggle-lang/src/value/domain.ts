import { REArgumentError, REDomainError } from "../errors/messages.js";
import { dateToMs, dateToString } from "../utility/DateTime.js";
import { Value } from "./index.js";

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
    if (value.type !== "Number") {
      throw new REDomainError(`Value of type ${value.type} must be a number`);
    }
    if (value.value < this.min || value.value > this.max) {
      throw new REDomainError(
        `Value ${value} must be within ${this.min} and ${this.max}`
      );
    }
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
}

export class DateRangeDomain extends BaseDomain {
  readonly type = "DateRange";
  readonly valueType = "Date";

  constructor(
    public min: Date,
    public max: Date
  ) {
    super();
  }

  toString() {
    return `Date.rangeDomain({ min: ${dateToString(
      this.min
    )}, max: ${dateToString(this.max)} })`;
  }

  validateValue(value: Value) {
    if (value.type !== "Date") {
      throw new REDomainError(`Value of type ${value.type} must be a date`);
    }
    if (value.value < this.min || value.value > this.max) {
      throw new REDomainError(
        `Value ${value} must be within ${dateToString(
          this.min
        )} and ${dateToString(this.max)}`
      );
    }
  }

  isEqual(other: DateRangeDomain) {
    return this.min === other.min && this.max === other.max;
  }

  get minAsNumber() {
    return dateToMs(this.min);
  }

  get maxAsNumber() {
    return dateToMs(this.max);
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
    throw new REArgumentError("Min value is not a number");
  }
  if (max.type !== "Number" && max.type !== "Date") {
    throw new REArgumentError("Max value is not a number");
  }

  if (min.value >= max.value) {
    throw new REArgumentError(
      `The range minimum (${min.value}) must be lower than the range maximum (${max.value})`
    );
  }

  if (min.type === "Date" && max.type === "Date") {
    return new DateRangeDomain(min.value, max.value);
  } else if (min.type === "Number" && max.type === "Number") {
    return new NumericRangeDomain(min.value, max.value);
  } else {
    throw new REArgumentError(
      `The range minimum and maximum must be of the same type. Got ${min.type} and ${max.type}`
    );
  }
}
