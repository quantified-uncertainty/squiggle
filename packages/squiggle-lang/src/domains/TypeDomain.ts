import { Type } from "../types/Type.js";
import { Value } from "../value/index.js";
import { BaseDomain } from "./BaseDomain.js";

/* Compile-time domain for a type */
export class TypeDomain<T> extends BaseDomain<T> {
  readonly kind = "Type";

  constructor(public readonly type: Type<T>) {
    super();
  }

  toString() {
    return this.type.display();
  }

  override validateValue(value: Value): void {
    if (this.type.unpack(value) === undefined) {
      throw new Error(
        `Expected value of type ${this.type.display()}, got ${value.type}`
      );
    }
  }
}
