import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { Specification, vSpecification } from "../value/VSpecification.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TSpecification extends Type<Specification> {
  unpack(v: Value) {
    return v.type === "Specification" ? v.value : undefined;
  }

  pack(v: Specification) {
    return vSpecification(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "Specification" };
  }
}

export const tSpecification = new TSpecification();
