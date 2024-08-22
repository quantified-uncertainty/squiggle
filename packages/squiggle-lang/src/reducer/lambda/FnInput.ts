import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../../serialization/squiggle.js";
import { UnwrapType } from "../../types/helpers.js";
import { Type } from "../../types/Type.js";

type Props<T> = {
  name?: string;
  optional?: boolean;
  type: Type<T>;
};

export type SerializedFnInput = {
  name?: string;
  optional?: boolean;
  type: number;
};

// FnInput represents a single parameter of a function.
// It's used both for builtin functions and for user-defined functions.
// Inputs can be optional, and they can have names.
export class FnInput<T> {
  readonly name: string | undefined;
  readonly optional: boolean;
  readonly type: Type<T>;

  constructor(props: Props<T>) {
    this.name = props.name;
    this.optional = props.optional ?? false;
    this.type = props.type;
  }

  toString() {
    if (this.optional) {
      return this.name ? `${this.name}?: ${this.type}` : `${this.type}?`;
    } else {
      return this.name ? `${this.name}: ${this.type}` : this.type.toString();
    }
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedFnInput {
    return {
      name: this.name,
      optional: this.optional,
      type: visit.type(this.type),
    };
  }

  static deserialize(
    input: SerializedFnInput,
    visit: SquiggleDeserializationVisitor
  ): FnInput<unknown> {
    return new FnInput({
      name: input.name,
      optional: input.optional,
      type: visit.type(input.type),
    });
  }
}

export function fnInput<const T extends Props<any>>(props: T) {
  return new FnInput<UnwrapType<T["type"]>>(props);
}

export function optionalInput<T>(type: Type<T>) {
  return new FnInput({
    type,
    optional: true,
  });
}

export function namedInput<T>(name: string, type: Type<T>) {
  return new FnInput({
    type,
    name,
  });
}
