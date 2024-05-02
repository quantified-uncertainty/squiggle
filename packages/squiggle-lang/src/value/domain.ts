import { REDomainError } from "../errors/messages.js";
import { SDate } from "../utility/SDate.js";
import { Value } from "./index.js";
import { Scale } from "./VScale.js";

function assertCorrectType<T extends Value["type"]>(
  value: Value,
  expectedType: T
): asserts value is Extract<Value, { type: T }> {
  if (value.type !== expectedType) {
    throw new REDomainError(
      `Parameter ${value.toString()}, of type ${
        value.type
      }, must be a ${expectedType}`
    );
  }
}

function assertWithinBounds(
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
    return `Number.rangeDomain(${this.min}, ${this.max})`;
  }

  validateValue(value: Value) {
    assertCorrectType(value, "Number");
    assertWithinBounds(this.min, this.max, value.value, this);
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
      method: { type: "linear" },
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

  get minAsNumber() {
    return this.min.toMs();
  }

  get maxAsNumber() {
    return this.max.toMs();
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "date" },
      min: this.min.toMs(),
      max: this.max.toMs(),
    };
  }
}

export type Domain = NumericRangeDomain | DateRangeDomain;

export type SerializedDomain =
  | {
      type: "NumericRange";
      min: number;
      max: number;
    }
  | {
      type: "DateRange";
      min: number;
      max: number;
    };

export function serializeDomain(domain: Domain): SerializedDomain {
  switch (domain.type) {
    case "NumericRange":
      return {
        type: "NumericRange",
        min: domain.min,
        max: domain.max,
      };
    case "DateRange":
      return {
        type: "DateRange",
        min: domain.min.toMs(),
        max: domain.max.toMs(),
      };
  }
}

export function deserializeDomain(domain: SerializedDomain): Domain {
  switch (domain.type) {
    case "NumericRange":
      return new NumericRangeDomain(domain.min, domain.max);
    case "DateRange":
      return new DateRangeDomain(
        SDate.fromMs(domain.min),
        SDate.fromMs(domain.max)
      );
  }
}
