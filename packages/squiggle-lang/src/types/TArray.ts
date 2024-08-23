import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TArray extends Type {
  constructor(public itemType: Type) {
    super();
  }

  check(v: Value) {
    if (v.type !== "Array") {
      return false;
    }
    if (this.itemType instanceof TAny) {
      return true;
    }
    for (const item of v.value) {
      if (!this.itemType.check(item)) {
        return false;
      }
    }
    return true;
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "Array",
      itemType: visit.type(this.itemType),
    };
  }

  toString() {
    return `List(${this.itemType})`;
  }

  override defaultFormInputCode() {
    return "[]";
  }

  override defaultFormInputType() {
    return "textArea" as const;
  }
}

export function tArray(itemType: Type) {
  return new TArray(itemType);
}
