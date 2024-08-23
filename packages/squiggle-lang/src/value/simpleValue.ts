import toPlainObject from "lodash/toPlainObject.js";

import { SampleSetDist } from "../dists/SampleSetDist/index.js";
import { REOther } from "../errors/messages.js";
import { BaseLambda, Lambda } from "../reducer/lambda.js";
import { ImmutableMap } from "../utility/immutable.js";
import { SDate } from "../utility/SDate.js";
import { Value } from "./index.js";
import { vArray } from "./VArray.js";
import { vBool } from "./VBool.js";
import { vDate } from "./VDate.js";
import { vDict } from "./VDict.js";
import { vDist } from "./VDist.js";
import { vInput } from "./VInput.js";
import { vLambda } from "./vLambda.js";
import { vNumber } from "./VNumber.js";
import { vScale } from "./VScale.js";
import { vString } from "./VString.js";
import { vVoid } from "./VVoid.js";

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
    case "Lambda":
      return value.value;
    case "Date":
      return value.value.toDate();
    case "Void":
      return null;
    case "Array":
      return value.value.map(simpleValueFromValue);
    case "Dict": {
      const v: SimpleValue = ImmutableMap(
        [...value.value.entries()].map(([k, v]) => [k, simpleValueFromValue(v)])
      );
      const fields: [string, SimpleValue][] = [
        ["vtype", "Dict"],
        ["value", v],
      ];
      return ImmutableMap(fields);
    }
    case "Calculator": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Calculator"],
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
    case "Specification": {
      const fields: [string, SimpleValue][] = [
        ["name", value.value.name],
        ["documentation", value.value.documentation],
        ["validate", value.value.validate],
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
        ["vType", "TableChart"],
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
    case "Input": {
      const fields: [string, SimpleValue][] = [
        ["vType", "Input"],
        ["type", value.value.type],
        ["name", value.value.name || ""],
        ["typeName", value.value.typeName || ""],
        ["description", value.value.description || ""],
        ["default", value.value.default || ""],
      ];
      return ImmutableMap(fields);
    }
    case "Scale": {
      const method = value.value.method;
      const fields: [string, SimpleValue][] = [
        ["vType", "Scale"],
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
          const fields: [string, SimpleValue][] = [
            ["vType", "SampleSetDist"],
            ["samples", [...dist.samples]],
            ["summary", simpleValueFromAny(dist.summarize())],
          ];
          return ImmutableMap(fields);
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
    return vDict(
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

function isSimpleValueWithoutLambdaMap(
  value: any
): value is SimpleValueWithoutLambdaMap {
  return value instanceof ImmutableMap;
}

function formatNumberArray(numbers: number[]): string[] {
  const sigFigs = 15;

  return numbers.map((num) => {
    if (num === 0) return "0";

    const absNum = Math.abs(num);
    const log10 = Math.floor(Math.log10(absNum));

    // Use scientific notation for very large or very small numbers
    if (log10 < -3 || log10 > 6) {
      const mantissa = num / Math.pow(10, log10);
      let formatted = mantissa.toFixed(sigFigs - 1).replace(/\.?0+$/, "");
      if (formatted === "1") {
        return `1e${log10}`;
      } else {
        return `${formatted}e${log10}`;
      }
    } else {
      // For numbers between 0.001 and 1,000,000, use fixed notation
      let formatted = num
        .toFixed(Math.max(0, sigFigs - log10 - 1))
        .replace(/\.?0+$/, "");
      if (formatted.includes(".")) {
        formatted = formatted.replace(/(\.\d*[1-9])0+$/, "$1");
      }
      return formatted;
    }
  });
}

export function summarizeSimpleValueWithoutLambda(
  value: SimpleValueWithoutLambda,
  depth: number = 0,
  maxDepth: number = 5,
  maxArrayItems: number = 5,
  maxDictItems: number = 30
): string {
  if (depth >= maxDepth) {
    return "...";
  }

  const indent = "  ".repeat(depth);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "[]";
    }
    const allNumbers = value.every(
      (item): item is number => typeof item === "number"
    );
    let items: string[];
    if (allNumbers) {
      items = formatNumberArray(value);
    } else {
      items = value.map((item) =>
        summarizeSimpleValueWithoutLambda(
          item,
          depth + 1,
          maxDepth,
          maxArrayItems,
          maxDictItems
        )
      );
    }
    const ellipsis =
      value.length > maxArrayItems ? `, ...${value.length} total` : "";
    return `[${items.slice(0, maxArrayItems).join(", ")}${ellipsis}]`;
  }

  if (isSimpleValueWithoutLambdaMap(value)) {
    if (value.size === 0) {
      return "{}";
    }
    const items = [...value.entries()]
      .slice(0, maxDictItems)
      .map(
        ([key, val]) =>
          `${key}: ${summarizeSimpleValueWithoutLambda(val, depth + 1, maxDepth, maxArrayItems, maxDictItems)}`
      );
    const ellipsis = value.size > maxArrayItems ? ", ..." : "";
    return `{\n${indent}  ${items.join(`,\n${indent}  `)}${ellipsis}\n${indent}}`;
  }

  // Handle other types (string, number, boolean, null, undefined)
  if (typeof value === "string") {
    return `"${value}"`;
  }
  if (typeof value === "number") {
    return formatNumberArray([value])[0];
  }
  return String(value);
}
