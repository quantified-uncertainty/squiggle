import { FnInput } from "../reducer/lambda/FnInput.js";
import { FrType, UnwrapFrType } from "./FrType.js";

type Props<T> = {
  name?: string;
  optional?: boolean;
  type: FrType<T>;
};

export class FrInput<T> {
  readonly name: string | undefined;
  readonly optional: boolean;
  readonly type: FrType<T>;

  constructor(props: Props<T>) {
    this.name = props.name;
    this.optional = props.optional ?? false;
    this.type = props.type;
  }

  toFnInput() {
    return new FnInput({
      name: this.name,
      optional: this.optional,
      type: this.type.type,
    });
  }

  toString() {
    return this.toFnInput().toString();
  }
}

export function frInput<const T extends Props<any>>(props: T) {
  return new FrInput<UnwrapFrType<T["type"]>>(props);
}

export function optionalInput<T>(type: FrType<T>) {
  return new FrInput({
    type,
    optional: true,
  });
}

export function namedInput<T>(name: string, type: FrType<T>) {
  return new FrInput({
    type,
    name,
  });
}
