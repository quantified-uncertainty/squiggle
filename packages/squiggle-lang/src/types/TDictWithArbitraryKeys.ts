import { ImmutableMap } from "../utility/immutable.js";
import { Value, vDict } from "../value/index.js";
import { Type } from "./Type.js";

export class TDictWithArbitraryKeys<T> extends Type<ImmutableMap<string, T>> {
  constructor(public itemType: Type<T>) {
    super();
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

  override isSupertype(other: Type<unknown>) {
    return (
      other instanceof TDictWithArbitraryKeys &&
      this.itemType.isSupertype(other.itemType)
    );
  }

  override display() {
    return `Dict(${this.itemType.display()})`;
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
