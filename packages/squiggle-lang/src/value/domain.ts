import { ErrorMessage, REOther } from "../errors/messages.js";
import { Err, Ok, result } from "../utility/result.js";
import { Value } from "./index.js";

type NumericRangeDomain = {
  type: "numericRange";
  min: number;
  max: number;
};

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
  return Ok({
    type: "numericRange",
    min: min.value,
    max: max.value,
  });
}

export function domainToString(domain: Domain): string {
  return `Range(${domain.min} to ${domain.max})`;
}
