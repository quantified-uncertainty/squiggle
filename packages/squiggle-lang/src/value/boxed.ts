import { ImmutableMap } from "../utility/immutableMap.js";
import { Value, vString, BaseValue } from "./index.js";

export type BoxedArgsType = {
  name?: string;
  description?: string;
  showAs?: Value;
};

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

  combine(other: BoxedArgsType) {
    return new BoxedArgs({
      ...this.value,
      ...other,
    });
  }
}

export class Boxed extends BaseValue {
  readonly type = "Boxed";
  readonly publicName = "Boxed";

  constructor(
    public value: Value,
    public args: BoxedArgs
  ) {
    super();
  }

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
