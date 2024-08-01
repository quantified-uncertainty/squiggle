import { FRType } from "./frTypes.js";

type Props<T> = {
  type: FRType<T>;
  name?: string;
  optional?: boolean;
};

export class FnInput<T> {
  type: FRType<T>;
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

export function fnInput<T>(props: Props<T>) {
  return new FnInput(props);
}

export function frOptional<T>(type: FRType<T>) {
  return new FnInput({ type, optional: true });
}

export function frNamed<T>(name: string, type: FRType<T>) {
  return new FnInput({ type, name });
}
