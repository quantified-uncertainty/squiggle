import { REArgumentError, REDomainError } from "../errors/messages.js";
import { dateFromMsToString, dateToMs } from "../utility/DateTime.js";
import { Value } from "./index.js";

abstract class BaseDomain {
  abstract type: string;
  abstract valueType: string;

  abstract toString(): string;

  abstract validateValue(value: Value): void;
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
}
export class DateRangeDomain extends BaseDomain {
  readonly type = "DateRange";
  readonly valueType = "Date";
  public min;
  public max;

  constructor(_min: Date, _max: Date) {
    super();
    this.min = dateToMs(_min);
    this.max = dateToMs(_max);
  }

  toString() {
    return `Date.rangeDomain({ min: ${dateFromMsToString(
      this.min
    )}, max: ${dateFromMsToString(this.max)} })`;
  }

  validateValue(value: Value) {
    if (value.type !== "Date") {
      throw new REDomainError(`Value of type ${value.type} must be a date`);
    }
    const valueTime = dateToMs(value.value);
    if (valueTime < this.min || valueTime > this.max) {
      throw new REDomainError(
        `Value ${value} must be within ${dateFromMsToString(
          this.min
        )} and ${dateFromMsToString(this.max)}`
      );
    }
  }

  isEqual(other: DateRangeDomain) {
    return this.min === other.min && this.max === other.max;
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
