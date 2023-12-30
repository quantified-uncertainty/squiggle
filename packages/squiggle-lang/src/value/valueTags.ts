import { result } from "../index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, fmap, mergeMany, Ok } from "../utility/result.js";
import {
  mergeScaleWithDefaults2,
  Scale,
  ScaleAttributes,
  Value,
  vBool,
  vScale,
  vString,
} from "./index.js";

export type ValueTagsType = {
  name?: string;
  description?: string;
  showAs?: Value;
  numberFormat?: string;
  dateFormat?: string;
  hidden?: boolean;
  xScale?: Scale;
  yScale?: Scale;
};

type ValueTagsTypeName = keyof ValueTagsType;

const valueTagsTypeNames: ValueTagsTypeName[] = [
  "name",
  "description",
  "showAs",
  "numberFormat",
  "dateFormat",
  "hidden",
  "xScale",
  "yScale",
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

  toList(): [string, Value][] {
    const result: [string, Value][] = [];
    const { value } = this;
    if (value.name) {
      result.push(["name", vString(value.name)]);
    }
    if (value.description) {
      result.push(["description", vString(value.description)]);
    }
    if (value.showAs) {
      result.push(["showAs", value.showAs]);
    }
    if (value.numberFormat) {
      result.push(["numberFormat", vString(value.numberFormat)]);
    }
    if (value.dateFormat) {
      result.push(["dateFormat", vString(value.dateFormat)]);
    }
    if (value.hidden) {
      result.push(["hidden", vBool(value.hidden)]);
    }
    if (value.xScale) {
      result.push(["xScale", vScale(value.xScale)]);
    }
    if (value.yScale) {
      result.push(["yScale", vScale(value.yScale)]);
    }
    return result;
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

  toMap(): ImmutableMap<string, Value> {
    return ImmutableMap(this.toList());
  }

  toString(): string {
    return this.toList()
      .map(([key, value]) => `${key}: ${value.toString()}`)
      .join(", ");
  }

  merge(other: ValueTagsType) {
    return new ValueTags({
      ...this.value,
      ...other,
    });
  }

  name() {
    return this.value.name;
  }

  description() {
    return this.value.description;
  }

  showAs() {
    return this.value.showAs;
  }

  numberFormat() {
    const tickFormat = this.value.xScale?.tickFormat;
    return tickFormat ?? this.value.numberFormat;
  }

  dateFormat() {
    const tickFormat = this.value.xScale?.tickFormat;
    return tickFormat ?? this.value.dateFormat;
  }

  hidden() {
    return this.value.hidden;
  }

  xScale(): ScaleAttributes | undefined {
    const format = this.value.numberFormat || this.value.dateFormat;
    const xScale = this.value.xScale;
    return mergeScaleWithDefaults2(xScale || {}, { tickFormat: format });
  }

  yScale(): ScaleAttributes | undefined {
    return this.value.xScale;
  }
}
