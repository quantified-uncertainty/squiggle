import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../../serialization/squiggle.js";
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
      return this.name
        ? `${this.name}?: ${this.type.display()}`
        : `${this.type.display()}?`;
    } else {
      return this.name
        ? `${this.name}: ${this.type.display()}`
        : this.type.display();
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

export function fnInput<T>(props: Props<T>) {
  return new FnInput(props);
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
