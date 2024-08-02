import { Type } from "../../types/Type.js";

type Props<T extends Type<any>> = {
  type: T;
  name?: string;
  optional?: boolean;
};

export class FnInput<T extends Type<any>> {
  type: T;
  name: string | undefined;
  optional: boolean;

  constructor(props: Props<T>) {
    this.type = props.type;
    this.name = props.name;
    this.optional = props.optional ?? false;
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
}

export function fnInput<T extends Type<any>>(props: Props<T>) {
  return new FnInput(props);
}

export function optionalInput<T extends Type<any>>(type: T) {
  return new FnInput({ type, optional: true });
}

export function namedInput<T extends Type<any>>(name: string, type: T) {
  return new FnInput({ type, name });
}
