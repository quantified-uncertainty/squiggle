import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { type Value } from "../value/index.js";
import { type InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";

export abstract class Type<T = unknown> {
  abstract unpack(v: Value): T | undefined;
  abstract pack(v: T): Value;
  abstract serialize(visit: SquiggleSerializationVisitor): SerializedType;

  // Default to "Bool" for "TBool" class, etc.
  // Subclasses can override this method to provide a more descriptive name.
  display() {
    const className = this.constructor.name;
    if (className.startsWith("T")) {
      return className.slice(1);
    }
    // shouldn't happen, the convention is that all types start with T
    return className;
  }

  toString() {
    return this.display();
  }

  // This check is good enough for most types (VBool, VNumber, etc.)
  // More complex types, e.g. TArray and TDict, override this method to provide a more specific check.
  isSupertype(other: Type<unknown>) {
    return other instanceof TAny || other instanceof this.constructor;
  }

  isTransparent() {
    return false;
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

  unpack(v: Value) {
    return v;
  }

  pack(v: Value) {
    return v;
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "Any", genericName: this.genericName };
  }

  override isSupertype() {
    // `any` is a supertype of all types
    return true;
  }

  override display() {
    return this.genericName ? `'${this.genericName}` : "any";
  }

  override isTransparent() {
    return true;
  }
}

export function tAny(params?: { genericName?: string }) {
  return new TAny(params?.genericName);
}
