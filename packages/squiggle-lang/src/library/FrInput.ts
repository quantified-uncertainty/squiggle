import { FnInput } from "../reducer/lambda/FnInput.js";
import { FrType } from "./FrType.js";

type Props<T> = {
  name?: string;
  type: FrType<T>;
};

export class FrInput<IsOptional extends boolean, Unpacked = unknown> {
  readonly name: string | undefined;
  readonly optional: IsOptional;
  readonly type: FrType<Unpacked>;

  constructor(props: Props<Unpacked>, optional: IsOptional) {
    this.name = props.name;
    this.type = props.type;
    this.optional = optional;
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

// `frInput` and `frOptionalInput` are separate, because we really care about type inference based on the optional flag.
export function frInput<const T>(props: Props<T>) {
  return new FrInput(props, false);
}

// If `frOptionalInput` is used, the function definition's parameter will be inferred to `T | null`.
export function frOptionalInput<const T>(props: Props<T>) {
  return new FrInput(props, true);
}

// shortcut for named input
export function namedInput<T>(name: string, type: FrType<T>) {
  return new FrInput(
    {
      type,
      name,
    },
    false
  );
}
