import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { type Value } from "../value/index.js";
import { type InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";

export abstract class Type<T = unknown> {
  abstract check(v: Value): boolean;
  abstract unpack(v: Value): T | undefined;
  abstract pack(v: T): Value;
  abstract serialize(visit: SquiggleSerializationVisitor): SerializedType;
  abstract display(): string;

  toString() {
    return this.display();
  }

  defaultFormInputCode() {
    return "";
  }

  defaultFormInputType(): InputType {
    return "text";
  }
}

export class TAny extends Type<Value> {
  constructor(public genericName?: string) {
    super();
  }

  check() {
    return true;
  }

  unpack(v: Value) {
    return v;
  }

  pack(v: Value) {
    return v;
  }

  display() {
    return this.genericName ? `'${this.genericName}` : "any";
  }

  serialize(): SerializedType {
    return { kind: "Any", genericName: this.genericName };
  }
}

export function tAny(params?: { genericName?: string }) {
  return new TAny(params?.genericName);
}
