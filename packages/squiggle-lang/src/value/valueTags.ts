import { LocationRange } from "../ast/parse.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { Err, fmap, mergeMany, Ok, result } from "../utility/result.js";
import { Value } from "./index.js";
import { type VBool } from "./VBool.js";
import { VSpecification } from "./VSpecification.js";
import { type VString } from "./VString.js";

// Note: this file can't call any `vType` constructors; it would cause a circular dependency because of `BaseValue` -> `ValueTags`.

// Some of these tags are value-type-specific, but we store everything in a single Dict, for now.
export type ValueTagsType = {
  name?: VString;
  doc?: VString;
  showAs?: Value;
  numberFormat?: VString; // can be set on numbers, dists and durations
  dateFormat?: VString; // can be set on dates
  hidden?: VBool;
  notebook?: VBool; // can be set on arrays
  exportData?: { sourceId: string; path: string[] };
  startOpenState?: VString;
  location?: LocationRange;
  specification?: VSpecification;
};

type ValueTagsTypeName = keyof ValueTagsType;

export type SerializedValueTags = {
  [K in Exclude<ValueTagsTypeName, "location" | "exportData">]?: number;
} & Pick<ValueTagsType, "location" | "exportData">;

const valueTagsTypeNames: ValueTagsTypeName[] = [
  "name",
  "doc",
  "showAs",
  "numberFormat",
  "dateFormat",
  "hidden",
  "notebook",
  "exportData",
  "startOpenState",
  "location",
  "specification",
];

function convertToValueTagsTypeName(
  key: string
): result<ValueTagsTypeName, string> {
  const validKeys: Set<string> = new Set(valueTagsTypeNames);
  if (validKeys.has(key)) {
    return Ok(key as ValueTagsTypeName);
  } else {
    // Throw an error if the key is not a valid ValueTagsTypeName
    return Err(
      `Invalid ValueTagsTypeName: ${key}. Must be one of ${valueTagsTypeNames.join(
        ","
      )}`
    );
  }
}

// I expect these to get much more complicated later, so it seemed prudent to make a class now.
export class ValueTags {
  constructor(public value: ValueTagsType) {}

  isEmpty() {
    return (
      this.value.name === undefined &&
      this.value.doc === undefined &&
      this.value.showAs === undefined &&
      this.value.numberFormat === undefined &&
      this.value.dateFormat === undefined &&
      this.value.hidden === undefined &&
      this.value.notebook === undefined &&
      this.value.exportData === undefined &&
      this.value.startOpenState === undefined &&
      this.value.location === undefined &&
      this.value.specification === undefined
    );
  }

  toString(): string {
    return valueTagsTypeNames
      .map((key) => {
        const value = this.value[key];
        if (value === undefined) return;
        if (
          value &&
          typeof value.toString === "function" &&
          value.constructor.name !== "Object"
        ) {
          return `${key}: ${value.toString()}`;
        }
        // Special handling for objects to prevent "[object Object]" output
        else if (typeof value === "object" && value !== null) {
          // See this for the regex: https://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
          return `${key}: ${JSON.stringify(value).replace(/"([^"]+)":/g, "$1:")}`;
        } else {
          // Fallback for simple types
          return `${key}: ${value}`;
        }
      })
      .filter((s) => s !== undefined)
      .join(", ");
  }

  omit(keys: ValueTagsTypeName[]) {
    const newValue: ValueTagsType = { ...this.value };
    keys.forEach((key) => delete newValue[key]);
    return new ValueTags(newValue);
  }

  omitUsingStringKeys(keys: string[]) {
    const params = mergeMany(keys.map(convertToValueTagsTypeName));
    //Don't simplify the omit call, as we need to ensure "this" is carried.
    return fmap(params, (args) => this.omit(args));
  }

  merge(other: ValueTagsType) {
    return new ValueTags({
      ...this.value,
      ...other,
    });
  }

  name() {
    return this.value.name?.value;
  }

  doc() {
    return this.value.doc?.value;
  }

  showAs() {
    return this.value.showAs;
  }

  numberFormat() {
    return this.value.numberFormat?.value;
  }

  dateFormat() {
    return this.value.dateFormat?.value;
  }

  hidden() {
    return this.value.hidden?.value;
  }

  notebook() {
    return this.value.notebook?.value;
  }

  location() {
    return this.value.location;
  }

  specification() {
    return this.value.specification;
  }

  startOpenState(): "open" | "closed" | undefined {
    const { value } = this.value.startOpenState ?? {};
    if (!value) {
      return undefined;
    }
    if (["open", "closed"].includes(value)) {
      return value as "open" | "closed";
    }

    // Shouldn't happen in `fr/tags.ts` is coded correctly, but we don't have a way to validate `VString` values yet.
    // I guess ignoring the value instead of failing here is a better choice,
    // wrong open/closed state is not important enough for a fatal error.
    return undefined;
  }

  exportData() {
    return this.value.exportData;
  }

  serialize(visit: SquiggleSerializationVisitor) {
    const result: SerializedValueTags = {};

    valueTagsTypeNames.forEach((key) => {
      if (this.value[key] === undefined) return;

      if (key === "exportData") {
        result[key] = this.value[key];
      } else if (key === "location") {
        result[key] = this.value[key];
      } else {
        result[key] = visit.value(this.value[key]!);
      }
    });
    return result;
  }

  static deserialize(
    node: SerializedValueTags,
    visit: SquiggleDeserializationVisitor
  ) {
    const value: ValueTagsType = {};
    valueTagsTypeNames.forEach((key) => {
      if (node[key] === undefined) return;
      if (key === "exportData") {
        value[key] = node[key];
      } else if (key === "location") {
        value[key] = node[key];
      } else {
        const valueId = node[key];
        if (valueId !== undefined) {
          value[key] = visit.value(valueId) as any;
        }
      }
    });
    return new ValueTags(value);
  }
}
