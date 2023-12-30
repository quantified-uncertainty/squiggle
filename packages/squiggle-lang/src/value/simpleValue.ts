import toPlainObject from "lodash/toPlainObject.js";

import { BaseLambda, Lambda } from "../reducer/lambda.js";
import { ImmutableMap } from "../utility/immutableMap.js";

export type SimpleValueMap = ImmutableMap<string, SimpleValue>;
export type SimpleValue =
  | SimpleValue[]
  | SimpleValueMap
  | Lambda
  | boolean
  | Date
  | number
  | string
  | null;

//This helps make sure that we can serialize everything, but it does a bad job at a lot of things. Useful as a quick fix.
export function anyToSimpleValue(data: any): SimpleValue {
  if (Array.isArray(data)) {
    return data.map(anyToSimpleValue);
  } else if (data instanceof Map) {
    return Object.fromEntries(data);
  } else if (typeof data === "object") {
    let items: [string, SimpleValue][] = [];
    for (const key in data) {
      items = [...items, [key, anyToSimpleValue(data[key])]];
    }
    return ImmutableMap(items);
  } else if (
    typeof data === "string" ||
    typeof data === "number" ||
    typeof data === "boolean"
  ) {
    return data;
  }
  return toPlainObject(data);
}

export type SimpleValueWithoutLambda =
  | SimpleValue[]
  | SimpleValueMap
  | boolean
  | Date
  | number
  | string
  | null;

function simpleValueWithoutLambda(
  value: SimpleValue
): SimpleValueWithoutLambda {
  if (value instanceof BaseLambda) {
    return null;
  } else if (Array.isArray(value)) {
    return value.map(simpleValueWithoutLambda);
  } else if (value instanceof Map) {
    return Object.fromEntries(
      [...value.entries()].map(([k, v]) => [k, simpleValueWithoutLambda(v)])
    );
  } else {
    return value;
  }
}
