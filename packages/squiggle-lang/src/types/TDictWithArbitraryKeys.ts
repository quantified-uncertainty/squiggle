import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TDictWithArbitraryKeys extends Type {
  constructor(public itemType: Type) {
    super();
  }

  check(v: Value) {
    if (v.type !== "Dict") {
      return false;
    }
    if (this.itemType instanceof TAny) {
      return true;
    }
    for (const value of v.value.values()) {
      if (!this.itemType.check(value)) {
        return false;
      }
    }
    return true;
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "DictWithArbitraryKeys",
      itemType: visit.type(this.itemType),
    };
  }

  toString() {
    return `Dict(${this.itemType})`;
  }

  override defaultFormInputCode() {
    return "{}";
  }

  override defaultFormInputType() {
    return "textArea" as const;
  }
}

export function tDictWithArbitraryKeys(itemType: Type) {
  return new TDictWithArbitraryKeys(itemType);
}
