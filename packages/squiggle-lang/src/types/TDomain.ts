import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vDomain } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TDomain<T> extends Type<Type<T>> {
  constructor(private type: Type<T>) {
    super();
  }

  unpack(v: Value): undefined {
    throw new Error("Domain unpacking is not implemented");
    /*
      // It should be something like this:

      if (v.type !== "Domain") {
        return;
      }
      return this.type.isSupertype(v.value) ? v.value : undefined;
      
      // But `isSupertype` is not enough for TypeScript-level type safety, and also I'm not even sure that it's correct.
    */
  }

  pack(v: Type<T>) {
    return vDomain(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "Domain", type: visit.type(this.type) };
  }
}

export function tDomain<T>(type: Type<T>) {
  return new TDomain(type);
}
