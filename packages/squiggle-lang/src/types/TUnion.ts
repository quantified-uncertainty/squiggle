import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TUnion extends Type {
  constructor(public types: Type[]) {
    super();
  }

  check(v: Value): boolean {
    return this.types.some((type) => type.check(v));
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Union",
      types: this.types.map(visit.type),
    };
  }

  toString() {
    return this.types.map((t) => t.toString()).join("|");
  }

  override defaultFormInputCode() {
    // This accounts for the case where types list is empty; should we catch this in the constructor instead?
    return (
      this.types.at(0)?.defaultFormInputCode() ?? super.defaultFormInputCode()
    );
  }

  override defaultFormInputType() {
    // TODO - is this ok? what if the first type is a checkbox and the second requries a text input?
    return (
      this.types.at(0)?.defaultFormInputType() ?? super.defaultFormInputType()
    );
  }
}

export function tUnion(types: Type[]) {
  return new TUnion(types);
}
