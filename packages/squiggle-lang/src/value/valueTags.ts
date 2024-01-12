import { result } from "../index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, fmap, mergeMany, Ok } from "../utility/result.js";
import { Scale, Value, vBool, vScale, vString } from "./index.js";

export type ValueTagsType = {
  name?: string;
  doc?: string;
  showAs?: Value;
  numberFormat?: string;
  dateFormat?: string;
  hidden?: boolean;
  xScale?: Scale;
  yScale?: Scale;
  notebook?: boolean;
};

type ValueTagsTypeName = keyof ValueTagsType;

const valueTagsTypeNames: ValueTagsTypeName[] = [
  "name",
  "doc",
  "showAs",
  "numberFormat",
  "dateFormat",
  "hidden",
  "xScale",
  "yScale",
  "notebook",
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
    return valueTagsTypeNames
      .filter((key) => this.value[key] !== undefined)
      .map((key) => {
        const value = this.value[key];
        switch (key) {
          case "name":
          case "doc":
          case "numberFormat":
          case "dateFormat":
            return [key, vString(value as string)];
          case "hidden":
          case "notebook":
            return [key, vBool(value as boolean)];
          case "xScale":
          case "yScale":
            return [key, vScale(value as Scale)];
          default:
            return [key, value as Value];
        }
      });
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

  doc() {
    return this.value.doc;
  }

  showAs() {
    return this.value.showAs;
  }

  numberFormat() {
    return this.value.numberFormat;
  }

  dateFormat() {
    return this.value.dateFormat;
  }

  hidden() {
    return this.value.hidden;
  }

  xScale(): Scale | undefined {
    return this.value.xScale;
  }

  yScale(): Scale | undefined {
    return this.value.yScale;
  }

  notebook() {
    return this.value.notebook;
  }
}
