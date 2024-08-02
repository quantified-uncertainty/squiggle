import { Value, vArray } from "../value/index.js";
import { UnwrapType } from "./helpers.js";
import { Type } from "./Type.js";

export class TArray<T> extends Type<readonly T[]> {
  constructor(private itemType: Type<T>) {
    super();
  }

  unpack(v: Value) {
    if (v.type !== "Array") {
      return undefined;
    }
    if (this.itemType.isTransparent()) {
      // special case, performance optimization
      return v.value as T[];
    }

    const unpackedArray: T[] = [];
    for (const item of v.value) {
      const unpackedItem = this.itemType.unpack(item);
      if (unpackedItem === undefined) {
        return undefined;
      }
      unpackedArray.push(unpackedItem);
    }
    return unpackedArray;
  }

  pack(v: readonly T[]) {
    return this.itemType.isTransparent()
      ? vArray(v as readonly Value[])
      : vArray(v.map((item) => this.itemType.pack(item)));
  }

  override display() {
    return `List(${this.itemType.display()})`;
  }

  override defaultFormInputCode() {
    return "[]";
  }

  override defaultFormInputType() {
    return "textArea" as const;
  }
}

export function tArray<T extends Type<any>>(itemType: T) {
  return new TArray<UnwrapType<T>>(itemType);
}
