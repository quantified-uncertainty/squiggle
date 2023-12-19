import { result } from "../index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { Err, fmap, mergeMany, Ok } from "../utility/result.js";
import { Value, vString } from "./index.js";

export type BoxedArgsType = {
  name?: string;
  description?: string;
  showAs?: Value;
  numberFormat?: string;
  dateFormat?: string;
};

type BoxedArgsTypeName = keyof BoxedArgsType;

const boxedArgsTypeNames: string[] = [
  "name",
  "description",
  "showAs",
  "numberFormat",
  "dateFormat",
];

function convertToBoxedArgsTypeName(
  key: string
): result<BoxedArgsTypeName, string> {
  const validKeys: Set<string> = new Set(boxedArgsTypeNames);
  if (validKeys.has(key)) {
    return Ok(key as BoxedArgsTypeName);
  } else {
    // Throw an error if the key is not a valid BoxedArgsTypeName
    return Err(
      `Invalid BoxedArgsTypeName: ${key}. Must be one of ${boxedArgsTypeNames.join(
        ","
      )}`
    );
  }
}

//I expect these to get much more complicated later, so it seemed prudent to make a class now.
export class BoxedArgs {
  constructor(public value: BoxedArgsType) {}

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
    return result;
  }

  omit(keys: BoxedArgsTypeName[]) {
    const newValue: BoxedArgsType = { ...this.value };
    keys.forEach((key) => delete newValue[key]);
    return new BoxedArgs(newValue);
  }

  omitUsingStringKeys(keys: string[]) {
    const params = mergeMany(keys.map(convertToBoxedArgsTypeName));
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

  merge(other: BoxedArgsType) {
    return new BoxedArgs({
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
    return this.value.numberFormat;
  }

  dateFormat() {
    return this.value.dateFormat;
  }
}

export class Boxed {
  constructor(
    public value: Value,
    public args: BoxedArgs
  ) {}

  toString(): string {
    const argsStr = this.args.toString();
    const valueString = this.value.toString();
    if (argsStr !== "") {
      return `${valueString}, with params ${argsStr}`;
    } else {
      return valueString;
    }
  }
}
