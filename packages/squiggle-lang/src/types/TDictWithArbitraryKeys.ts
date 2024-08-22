import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutable.js";
import { Value, vDict } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TDictWithArbitraryKeys<T> extends Type<ImmutableMap<string, T>> {
  constructor(public itemType: Type<T>) {
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

  unpack(v: Value) {
    if (v.type !== "Dict") {
      return undefined;
    }
    // TODO - skip loop and copying if itemType is `any`
    let unpackedMap: ImmutableMap<string, T> = ImmutableMap();
    for (const [key, value] of v.value.entries()) {
      const unpackedItem = this.itemType.unpack(value);
      if (unpackedItem === undefined) {
        return undefined;
      }
      unpackedMap = unpackedMap.set(key, unpackedItem);
    }
    return unpackedMap;
  }

  pack(v: ImmutableMap<string, T>) {
    return vDict(
      ImmutableMap([...v.entries()].map(([k, v]) => [k, this.itemType.pack(v)]))
    );
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

export function tDictWithArbitraryKeys<T>(itemType: Type<T>) {
  return new TDictWithArbitraryKeys(itemType);
}
