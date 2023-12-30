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

function _isSimpleValueMap(value: SimpleValue): value is SimpleValueMap {
  return value instanceof ImmutableMap;
}

export type SimpleValueWithoutLambdaMap = ImmutableMap<
  string,
  SimpleValueWithoutLambda
>;
export type SimpleValueWithoutLambda =
  | SimpleValueWithoutLambda[]
  | SimpleValueWithoutLambdaMap
  | boolean
  | Date
  | number
  | string
  | null;

function removeLambdas(value: SimpleValue): SimpleValueWithoutLambda {
  if (value instanceof BaseLambda) {
    return ImmutableMap([
      ["vType", "Lambda"],
      ["toString", value.toString()],
      ["paramenterString", value.parameterString()],
    ]);
  } else if (Array.isArray(value)) {
    return value.map(removeLambdas);
  } else if (_isSimpleValueMap(value)) {
    return ImmutableMap(
      [...value.entries()].map(([k, v]) => [k, removeLambdas(v)])
    );
  } else {
    return value;
  }
}

export function toJson(value: SimpleValueWithoutLambda): any {
  if (Array.isArray(value)) {
    return value.map(toJson);
  } else if (_isSimpleValueMap(value)) {
    const obj: Record<string, any> = {};
    value.forEach((value, key) => {
      obj[key] = toJson(value);
    });
    return obj;
  } else {
    // For boolean, Date, number, string, undefined, just return the value
    // Date objects will be converted to ISO string format
    return value instanceof Date ? value.toISOString() : value;
  }
}

//This helps make sure that we can serialize everything, but it does a bad job at a lot of things. Useful as a quick fix.
export function fromAny(data: any): SimpleValue {
  if (Array.isArray(data)) {
    return data.map(fromAny);
  } else if (data instanceof Map) {
    return Object.fromEntries(data);
  } else if (typeof data === "object") {
    let items: [string, SimpleValue][] = [];
    for (const key in data) {
      items = [...items, [key, fromAny(data[key])]];
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

export function fromValue(value: Value): SimpleValue {
  switch (value.type) {
    case "Bool":
    case "Number":
    case "String":
    case "Lambda":
      return value.value;
    case "Date":
      return value.value.toDate();
    case "Void":
      return null;
    case "Array":
      return value.value.map(fromValue);
    case "Dict":
      return ImmutableMap(
        [...value.value.entries()].map(([k, v]) => [k, fromValue(v)])
      );
    case "Calculator": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Calculator"],
        ["fn", value.value.fn],
        ["inputs", value.value.inputs.map((x) => fromValue(vInput(x)))],
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
                ["distribution", fromValue(vDist(x.distribution))],
              ])
            ),
          ]);
          fields.push(["xScale", fromValue(vScale(value.value.xScale))]);
          fields.push(["yScale", fromValue(vScale(value.value.yScale))]);
          fields.push(["showSummary", value.value.showSummary]);
          break;
        case "numericFn":
          fields.push(["fn", value.value.fn]);
          fields.push(["xScale", fromValue(vScale(value.value.xScale))]);
          fields.push(["yScale", fromValue(vScale(value.value.yScale))]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "distFn":
          fields.push(["fn", value.value.fn]);
          fields.push(["xScale", fromValue(vScale(value.value.xScale))]);
          fields.push(["yScale", fromValue(vScale(value.value.yScale))]);
          fields.push([
            "distXScale",
            fromValue(vScale(value.value.distXScale)),
          ]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "scatter":
          fields.push(["xDist", fromValue(vDist(value.value.xDist))]);
          fields.push(["yDist", fromValue(vDist(value.value.yDist))]);
          fields.push(["xScale", fromValue(vScale(value.value.xScale))]);
          fields.push(["yScale", fromValue(vScale(value.value.yScale))]);
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
        ["data", value.value.data.map(fromValue)],
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
          return fromAny(value.value);
        case "SymbolicDist":
          return fromAny(value.value);
        case "SampleSetDist": {
          const dist = value.value as SampleSetDist;
          return [...dist.samples];
        }
        default:
          return fromAny(value.value);
      }
    default:
      throw new REOther(`Can't convert ${value.type} to simple value`);
  }
}

export function toValue(value: SimpleValue): Value {
  if (Array.isArray(value)) {
    return vArray(value.map(toValue));
  } else if (_isSimpleValueMap(value)) {
    return vDict(
      ImmutableMap([...value.entries()].map(([k, v]) => [k, toValue(v)]))
    );
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
