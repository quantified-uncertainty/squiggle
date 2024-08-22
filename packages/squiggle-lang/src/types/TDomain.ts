import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vDomain } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TDomain<T> extends Type<Type<T>> {
  constructor(public type: Type<T>) {
    super();
  }

  override check(v: Value) {
    return v.type === "Domain";
  }

  unpack(v: Value): undefined {
    throw new Error("Domain unpacking is not implemented");
    /*
      // It should be something like this:

      if (v.type !== "Domain") {
        return;
      }
      return isSupertype(this.type, v.value) ? v.value : undefined;
      
      // But `isSupertypeOf` is not enough for TypeScript-level type safety, and also I'm not even sure that it's correct.
      // This is not a big problem because we don't have stdlib functions that take domains yet.
    */
  }

  pack(v: Type<T>) {
    return vDomain(v);
  }

  toString() {
    return `Domain(${this.type})`;
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "Domain", type: visit.type(this.type) };
  }
}

export function tDomain<T>(type: Type<T>) {
  return new TDomain(type);
}
