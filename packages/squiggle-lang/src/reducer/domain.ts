import { Value } from "../value/index.js";

type NumericRangeDomain = {
  type: "numericRange";
  min: number;
  max: number;
};

export type Domain = NumericRangeDomain;

export function valueToDomain(value: Value): Domain {
  if (value.type !== "Array") {
    throw new Error("Only array domains are supported");
  }
  if (value.value.length !== 2) {
    throw new Error("Expected two-value array");
  }
  const [min, max] = value.value;
  if (min.type !== "Number") {
    throw new Error("Min value is not a number");
  }
  if (max.type !== "Number") {
    throw new Error("Max value is not a number");
  }
  return {
    type: "numericRange",
    min: min.value,
    max: max.value,
  };
}
