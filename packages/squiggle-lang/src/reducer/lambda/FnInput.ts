import { BaseDomain } from "../../domains/BaseDomain.js";
import { Domain } from "../../domains/index.js";
import { TypeDomain } from "../../domains/TypeDomain.js";
import { Type } from "../../types/Type.js";

type Props<T> = {
  domain: Extract<Domain, BaseDomain<T>>;
  name?: string;
  optional?: boolean;
};

export class FnInput<T> {
  readonly domain: Extract<Domain, BaseDomain<T>>;
  readonly name: string | undefined;
  readonly optional: boolean;
  readonly type: Type<T>;

  constructor(props: Props<T>) {
    this.domain = props.domain;
    this.name = props.name;
    this.optional = props.optional ?? false;
    this.type = this.domain.type; // for convenience and a bit of performance
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

export function fnInput<T>(
  props: Omit<Props<T>, "domain"> & { type: Type<T> }
) {
  return new FnInput({
    ...props,
    domain: new TypeDomain(props.type),
  });
}

export function optionalInput<T>(type: Type<T>) {
  return new FnInput({
    domain: new TypeDomain(type),
    optional: true,
  });
}

export function namedInput<T>(name: string, type: Type<T>) {
  return new FnInput({
    domain: new TypeDomain(type),
    name,
  });
}
