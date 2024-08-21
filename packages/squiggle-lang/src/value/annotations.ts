import { ErrorMessage } from "../errors/messages.js";
import { TDateRange } from "../types/TDateRange.js";
import { TNumberRange } from "../types/TNumberRange.js";
import { Type } from "../types/Type.js";
import { Value } from "./index.js";

function assertMinLessThanMax(min: number, max: number) {
  if (min >= max) {
    throw ErrorMessage.argumentError(
      `The range minimum (${min}) must be lower than the range maximum (${max})`
    );
  }
}

export function annotationToDomain(value: Value): Type {
  if (value.type === "Domain") {
    return value.value;
  }
  if (value.type !== "Array") {
    throw ErrorMessage.argumentError("Only array domains are supported");
  }
  if (value.value.length !== 2) {
    throw ErrorMessage.argumentError("Expected two-value array");
  }
  const [min, max] = value.value;
  if (min.type !== "Number" && min.type !== "Date") {
    throw ErrorMessage.argumentError("Min value is not a number or date");
  }
  if (max.type !== "Number" && max.type !== "Date") {
    throw ErrorMessage.argumentError("Max value is not a number or date");
  }

  if (min.type === "Date" && max.type === "Date") {
    assertMinLessThanMax(min.value.toMs(), max.value.toMs());
    return new TDateRange(min.value, max.value);
  } else if (min.type === "Number" && max.type === "Number") {
    assertMinLessThanMax(min.value, max.value);
    return new TNumberRange(min.value, max.value);
  } else {
    throw ErrorMessage.argumentError(
      `The range minimum and maximum must be of the same type. Got ${min.type} and ${max.type}`
    );
  }
}
