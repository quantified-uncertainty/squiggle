import { REOther } from "../errors/messages.js";
import { Value } from "./index.js";

abstract class BaseDomain {
  abstract type: string;

  abstract toString(): string;

  abstract includes(value: Value): boolean;
}

export class NumericRangeDomain extends BaseDomain {
  readonly type = "NumericRange";

  constructor(
    public min: number,
    public max: number
  ) {
    super();
  }

  toString() {
    return `Number.rangeDomain({ min: ${this.min}, max: ${this.max} })`;
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

export function annotationToDomain(value: Value): Domain {
  if (value.type === "Domain") {
    return value.value;
  }
  if (value.type !== "Array") {
    throw new REOther("Only array domains are supported");
  }
  if (value.value.length !== 2) {
    throw new REOther("Expected two-value array");
  }
  const [min, max] = value.value;
  if (min.type !== "Number") {
    throw new REOther("Min value is not a number");
  }
  if (max.type !== "Number") {
    throw new REOther("Max value is not a number");
  }

  if (min.value >= max.value) {
    throw new REOther(
      `The range minimum (${min.value}) must be lower than the range maximum (${max.value})`
    );
  }

  return new NumericRangeDomain(min.value, max.value);
}
