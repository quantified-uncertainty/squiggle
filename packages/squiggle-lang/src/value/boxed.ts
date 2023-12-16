import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vString } from "./index.js";

export type BoxedArgsType = {
  name?: string;
  description?: string;
  showAs?: Value;
  numberFormat?: string;
  dateFormat?: string;
};

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
