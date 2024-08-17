import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

// TODO - this only supports union types of 2 types. We should support more than
// 2 types, but it's not clear how to implement pack/unpack for that.
export class TUnion extends Type<Value> {
  constructor(public types: Type[]) {
    super();
  }

  check(v: Value): boolean {
    return this.types.some((type) => type.check(v));
  }

  unpack(v: Value) {
    return this.check(v) ? v : undefined;
  }

  pack(v: Value) {
    return v;
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Union",
      types: this.types.map(visit.type),
    };
  }

  override display() {
    return this.types.map((t) => t.display()).join("|");
  }
}

export function tUnion(types: Type[]) {
  return new TUnion(types);
}
