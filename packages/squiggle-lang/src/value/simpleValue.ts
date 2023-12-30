import toPlainObject from "lodash/toPlainObject.js";

import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { REOther } from "../errors/messages.js";
import { SDate } from "../index.js";
import { BaseLambda, Lambda } from "../reducer/lambda.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import {
  Value,
  vArray,
  vBool,
  vDate,
  vDict,
  vDist,
  vInput,
  vLambda,
  vNumber,
  vScale,
  vString,
  vVoid,
} from "./index.js";

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

export function valueToSimpleValue(value: Value): SimpleValue {
  if (
    value.type === "Bool" ||
    value.type === "Number" ||
    value.type === "String"
  ) {
    return value.value;
  } else if (value.type === "Date") {
    return value.value.toDate();
  } else if (value.type === "Void") {
    return null;
  } else if (value.type === "Lambda") {
    return value.value;
  }
  switch (value.type) {
    case "Array":
      return value.value.map(valueToSimpleValue);
    case "Dict":
      return ImmutableMap(
        [...value.value.entries()].map(([k, v]) => [k, valueToSimpleValue(v)])
      );
    case "Calculator": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Calculator"],
        ["fn", value.value.fn],
        [
          "inputs",
          value.value.inputs.map((x) => valueToSimpleValue(vInput(x))),
        ],
        ["autorun", value.value.autorun],
        ["description", value.value.description || ""],
        ["title", value.value.title || ""],
        ["sampleCount", value.value.sampleCount || 100],
      ];
      return ImmutableMap(fields);
    }
    case "Plot": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Plot"],
        ["type", value.value.type],
        ["title", value.value.title || ""],
      ];
      switch (value.value.type) {
        case "distributions":
          fields.push([
            "distributions",
            value.value.distributions.map((x) =>
              ImmutableMap([
                ["name", x.name || ""],
                ["distribution", valueToSimpleValue(vDist(x.distribution))],
              ])
            ),
          ]);
          fields.push([
            "xScale",
            valueToSimpleValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            valueToSimpleValue(vScale(value.value.yScale)),
          ]);
          fields.push(["showSummary", value.value.showSummary]);
          break;
        case "numericFn":
          fields.push(["fn", value.value.fn]);
          fields.push([
            "xScale",
            valueToSimpleValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            valueToSimpleValue(vScale(value.value.yScale)),
          ]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "distFn":
          fields.push(["fn", value.value.fn]);
          fields.push([
            "xScale",
            valueToSimpleValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            valueToSimpleValue(vScale(value.value.yScale)),
          ]);
          fields.push([
            "distXScale",
            valueToSimpleValue(vScale(value.value.distXScale)),
          ]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "scatter":
          fields.push(["xDist", valueToSimpleValue(vDist(value.value.xDist))]);
          fields.push(["yDist", valueToSimpleValue(vDist(value.value.yDist))]);
          fields.push([
            "xScale",
            valueToSimpleValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            valueToSimpleValue(vScale(value.value.yScale)),
          ]);
          break;
        case "relativeValues":
          fields.push(["fn", value.value.fn]);
          fields.push(["ids", [...value.value.ids]]);
          break;
      }
      return ImmutableMap(fields);
    }
    case "TableChart": {
      const fields: [string, SimpleValue][] = [
        ["vType", "TableChart"],
        ["data", value.value.data.map(valueToSimpleValue)],
        [
          "columns",
          value.value.columns.map((column) => {
            const data: [string, SimpleValue][] = [
              ["fn", column.fn],
              ["name", column.name || ""],
            ];
            return ImmutableMap(data);
          }),
        ],
      ];
      return ImmutableMap(fields);
    }
    case "Scale": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Scale"],
        ["type", value.value.type],
        ["tickFormat", value.value.tickFormat || ""],
        ["title", value.value.title || ""],
      ];
      value.value.min && fields.push(["min", value.value.min]);
      value.value.max && fields.push(["max", value.value.max]);
      switch (value.value.type) {
        case "symlog":
          fields.push(["constant", value.value.constant || null]);
          break;
        case "power":
          fields.push(["exponent", value.value.exponent || null]);
          break;
      }
      return ImmutableMap(fields);
    }
    case "Dist":
      switch (value.value.type) {
        case "PointSetDist":
          return anyToSimpleValue(value.value);
        case "SymbolicDist":
          return anyToSimpleValue(value.value);
        case "SampleSetDist": {
          const dist = value.value as SampleSetDist;
          return [...dist.samples];
        }
        default:
          return anyToSimpleValue(value.value);
      }
    default:
      throw new REOther(`Can't convert ${value.type} to simple value`);
  }
}

function isSimpleValueMap(value: SimpleValue): value is SimpleValueMap {
  return value instanceof ImmutableMap;
}

export function toValue(value: SimpleValue): Value {
  if (Array.isArray(value)) {
    return vArray(value.map(toValue));
  } else if (isSimpleValueMap(value)) {
    return vDict(
      ImmutableMap([...value.entries()].map(([k, v]) => [k, toValue(v)]))
    );
    return vString("");
  } else if (typeof value === "boolean") {
    return vBool(value);
  } else if (typeof value === "number") {
    return vNumber(value);
  } else if (typeof value === "string") {
    return vString(value);
  } else if (value === null) {
    return vVoid();
  } else if (value instanceof Date) {
    return vDate(SDate.fromDate(value));
  } else if (value instanceof BaseLambda) {
    return vLambda(value);
  } else {
    console.log("Couldn't find value for", value);
    return vVoid();
  }
}
