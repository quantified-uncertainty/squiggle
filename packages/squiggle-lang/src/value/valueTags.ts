import { result } from "../index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, fmap, mergeMany, Ok } from "../utility/result.js";
import { Value, vBool, vString } from "./index.js";

export type ValueTagsType = {
  name?: string;
  doc?: Value;
  showAs?: Value;
  numberFormat?: string;
  dateFormat?: string;
  hidden?: boolean;
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
    const result: [string, Value][] = [];
    const { value } = this;
    if (value.name) {
      result.push(["name", vString(value.name)]);
    }
    if (value.doc) {
      result.push(["doc", value.doc]);
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
    if (value.notebook) {
      result.push(["notebook", vBool(value.notebook)]);
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

  notebook() {
    return this.value.notebook;
  }
}
