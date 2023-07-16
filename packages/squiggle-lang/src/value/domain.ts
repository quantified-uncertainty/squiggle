import { ErrorMessage, REOther } from "../errors/messages.js";
import { Err, Ok, result } from "../utility/result.js";
import { Value } from "./index.js";

abstract class BaseDomain {
  abstract type: string;

  abstract toString(): string;

  abstract includes(value: Value): boolean;
}

class NumericRangeDomain extends BaseDomain {
  readonly type = "NumericRange";

  constructor(public min: number, public max: number) {
    super();
  }

  toString() {
    return `Range(${this.min} to ${this.max})`;
  }

  includes(value: Value) {
    return (
      value.type === "Number" &&
      value.value >= this.min &&
      value.value <= this.max
    );
  }
}

export type Domain = NumericRangeDomain;

export function annotationToDomain(value: Value): result<Domain, ErrorMessage> {
  if (value.type !== "Array") {
    return Err(new REOther("Only array domains are supported"));
  }
  if (value.value.length !== 2) {
    return Err(new REOther("Expected two-value array"));
  }
  const [min, max] = value.value;
  if (min.type !== "Number") {
    return Err(new REOther("Min value is not a number"));
  }
  if (max.type !== "Number") {
    return Err(new REOther("Max value is not a number"));
  }

  if (min.value > max.value) {
    return Err(new REOther(`Min value ${min.value} > max value ${max.value}`));
  }

  return Ok(new NumericRangeDomain(min.value, max.value));
}
