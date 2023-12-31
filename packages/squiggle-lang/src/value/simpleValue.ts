import toPlainObject from "lodash/toPlainObject.js";

import { SampleSetDist } from "../dist/SampleSetDist/index.js";
import { REOther } from "../errors/messages.js";
import { SDate } from "../index.js";
const TYPE_KEY = "vType";
const LAMBDA_TYPE = "Lambda";
const TO_STRING_KEY = "toString";
const PARAMETER_STRING_KEY = "paramenterString";
const CALCULATOR_TYPE = "Calculator";
const PLOT_TYPE = "Plot";
const TABLE_CHART_TYPE = "TableChart";
const SCALE_TYPE = "Scale";

import { BaseLambda, Lambda } from "../reducer/lambda.js";
const DICT_TYPE = "Dict";
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

export function removeLambdas(value: SimpleValue): SimpleValueWithoutLambda {
  if (value instanceof BaseLambda) {
    return ImmutableMap([
      [TYPE_KEY, LAMBDA_TYPE],
      [TO_STRING_KEY, value.toString()],
      [PARAMETER_STRING_KEY, value.parameterString()]
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

export function simpleValueToJson(value: SimpleValueWithoutLambda): unknown {
  if (Array.isArray(value)) {
    return value.map(simpleValueToJson);
  } else if (_isSimpleValueMap(value)) {
    const obj: Record<string, unknown> = {};
    value.forEach((value, key) => {
      obj[key] = simpleValueToJson(value);
    });
    return obj;
  } else {
    // For boolean, Date, number, string, undefined, just return the value
    // Date objects will be converted to ISO string format
    return value instanceof Date ? value.toISOString() : value;
  }
}

//This helps make sure that we can serialize everything, but it does a bad job at a lot of things. Useful as a quick fix.
export function simpleValueFromAny(data: any): SimpleValue {
  if (Array.isArray(data)) {
    return data.map(simpleValueFromAny);
  } else if (data instanceof Map) {
    return Object.fromEntries(data);
  } else if (typeof data === "object") {
    let items: [string, SimpleValue][] = [];
    for (const key in data) {
      items = [...items, [key, simpleValueFromAny(data[key])]];
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

export function simpleValueFromValue(value: Value): SimpleValue {
  switch (value.type) {
    case "Bool":
    case "Number":
    case "String":
    case LAMBDA_TYPE:
      return value.value;
    case "Date":
      return value.value.toDate();
    case "Void":
      return null;
    case "Array":
      return value.value.map(simpleValueFromValue);
    case DICT_TYPE: {
      const v: SimpleValue = ImmutableMap(
        [...value.value.entries()].map(([k, v]) => [k, simpleValueFromValue(v)])
      );
      const fields: [string, SimpleValue][] = [
        [TYPE_KEY, DICT_TYPE],
        ["value", v],
      ];
      return ImmutableMap(fields);
    }
    case "Calculator": {
      const fields: [string, SimpleValue][] = [
        [TYPE_KEY, CALCULATOR_TYPE],
        ["fn", value.value.fn],
        [
          "inputs",
          value.value.inputs.map((x) => simpleValueFromValue(vInput(x))),
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
        [TYPE_KEY, PLOT_TYPE],
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
                ["distribution", simpleValueFromValue(vDist(x.distribution))],
              ])
            ),
          ]);
          fields.push([
            "xScale",
            simpleValueFromValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            simpleValueFromValue(vScale(value.value.yScale)),
          ]);
          fields.push(["showSummary", value.value.showSummary]);
          break;
        case "numericFn":
          fields.push(["fn", value.value.fn]);
          fields.push([
            "xScale",
            simpleValueFromValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            simpleValueFromValue(vScale(value.value.yScale)),
          ]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "distFn":
          fields.push(["fn", value.value.fn]);
          fields.push([
            "xScale",
            simpleValueFromValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            simpleValueFromValue(vScale(value.value.yScale)),
          ]);
          fields.push([
            "distXScale",
            simpleValueFromValue(vScale(value.value.distXScale)),
          ]);
          if (value.value.xPoints) {
            fields.push(["points", value.value.xPoints]);
          }
          break;
        case "scatter":
          fields.push([
            "xDist",
            simpleValueFromValue(vDist(value.value.xDist)),
          ]);
          fields.push([
            "yDist",
            simpleValueFromValue(vDist(value.value.yDist)),
          ]);
          fields.push([
            "xScale",
            simpleValueFromValue(vScale(value.value.xScale)),
          ]);
          fields.push([
            "yScale",
            simpleValueFromValue(vScale(value.value.yScale)),
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
        [TYPE_KEY, TABLE_CHART_TYPE],
        ["data", value.value.data.map(simpleValueFromValue)],
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
      const method = value.value.method;
      const fields: [string, SimpleValue][] = [
        [TYPE_KEY, SCALE_TYPE],
        ["type", method?.type || ""],
        ["tickFormat", value.value.tickFormat || ""],
        ["title", value.value.title || ""],
      ];
      value.value.min && fields.push(["min", value.value.min]);
      value.value.max && fields.push(["max", value.value.max]);
      switch (method?.type) {
        case "symlog":
          fields.push(["constant", method.constant || null]);
          break;
        case "power":
          fields.push(["exponent", method.exponent || null]);
          break;
      }
      return ImmutableMap(fields);
    }
    case "Dist":
      switch (value.value.type) {
        case "PointSetDist":
          return simpleValueFromAny(value.value);
        case "SymbolicDist":
          return simpleValueFromAny(value.value);
        case "SampleSetDist": {
          const dist = value.value as SampleSetDist;
          return [...dist.samples];
        }
        default:
          return simpleValueFromAny(value.value);
      }
    default:
      throw new REOther(`Can't convert ${value.type} to simple value`);
  }
}

export function simpleValueToValue(value: SimpleValue): Value {
  if (Array.isArray(value)) {
    return vArray(value.map(simpleValueToValue));
  } else if (_isSimpleValueMap(value)) {
    return vDict(DICT_TYPE,DICT_TYPE,
      ImmutableMap(
        [...value.entries()].map(([k, v]) => [k, simpleValueToValue(v)])
      )
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
