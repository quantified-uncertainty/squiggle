import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { VSpecification } from "../value/VSpecification.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TSpecificationWithTags extends Type<VSpecification> {
  unpack(v: Value) {
    return v.type === "Specification" ? v : undefined;
  }

  pack(v: VSpecification) {
    return v;
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "SpecificationWithTags" };
  }

  override display() {
    return "Specification";
  }
}

export const tSpecificationWithTags = new TSpecificationWithTags();
