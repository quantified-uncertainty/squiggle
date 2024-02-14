import { REArgumentError } from "../errors/messages.js";
import { DateRangeDomain, Domain, NumericRangeDomain } from "./domain.js";
import { Value } from "./index.js";

function assertMinLessThanMax(min: number, max: number) {
  if (min >= max) {
    throw new REArgumentError(
      `The range minimum (${min}) must be lower than the range maximum (${max})`
    );
  }
}

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
    assertMinLessThanMax(min.value.toMs(), max.value.toMs());
    return new DateRangeDomain(min.value, max.value);
  } else if (min.type === "Number" && max.type === "Number") {
    assertMinLessThanMax(min.value, max.value);
    return new NumericRangeDomain(min.value, max.value);
  } else {
    throw new REArgumentError(
      `The range minimum and maximum must be of the same type. Got ${min.type} and ${max.type}`
    );
  }
}
