import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vArray } from "../value/index.js";
import { UnwrapType } from "./helpers.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TArray<T> extends Type<readonly T[]> {
  constructor(public itemType: Type<T>) {
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

  unpack(v: Value): readonly T[] | undefined {
    if (v.type !== "Array") {
      return undefined;
    }
    if (this.itemType instanceof TAny) {
      // special case, performance optimization
      return v.value as readonly T[];
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
    return this.itemType instanceof TAny
      ? vArray(v as readonly Value[])
      : vArray(v.map((item) => this.itemType.pack(item)));
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

export function tArray<T extends Type<any>>(itemType: T) {
  return new TArray<UnwrapType<T>>(itemType);
}
