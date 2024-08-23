import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TTuple extends Type {
  constructor(public types: Type[]) {
    super();
  }

  check(v: Value): boolean {
    if (v.type !== "Array" || v.value.length !== this.types.length) {
      return false;
    }
    return this.types.every((type, i) => type.check(v.value[i]));
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Tuple",
      types: this.types.map((type) => visit.type(type)),
    };
  }

  toString() {
    return `[${this.types.map((type) => type.toString()).join(", ")}]`;
  }

  override defaultFormInputCode() {
    return `[${this.types.map((type) => type.defaultFormInputCode()).join(", ")}]`;
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }
}

export function tTuple(...types: Type[]) {
  return new TTuple(types);
}
