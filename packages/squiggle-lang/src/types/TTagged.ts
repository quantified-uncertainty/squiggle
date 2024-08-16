import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { ValueTags } from "../value/valueTags.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TTagged<T> extends Type<{ value: T; tags: ValueTags }> {
  constructor(public itemType: Type<T>) {
    super();
  }

  check(v: Value): boolean {
    return this.itemType.check(v);
  }

  unpack(v: Value) {
    const unpackedItem = this.itemType.unpack(v);
    if (unpackedItem === undefined) {
      return undefined;
    }
    return {
      value: unpackedItem,
      tags: v.tags ?? new ValueTags({}),
    };
  }

  // This will overwrite the original tags in case of `frWithTags(frAny())`. But
  // in that situation you shouldn't use `frWithTags`, a simple `frAny` will do.
  // (TODO: this is not true anymore, `frAny` can be valid for the sake of naming a generic type; investigate)
  pack({ value, tags }: { value: T; tags: ValueTags }) {
    return this.itemType.pack(value).copyWithTags(tags);
  }

  isSupertypeOf(other: Type): boolean {
    if (other instanceof TAny) {
      return true;
    }
    if (other instanceof TTagged) {
      // `f(x: Tagged<Number>)` can be called with `Tagged<Number>`
      return this.itemType.isSupertypeOf(other.itemType);
    } else {
      // `f(x: Tagged<Number>)` can be called with `Number`
      return this.itemType.isSupertypeOf(other);
    }
  }

  serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "WithTags",
      itemType: visit.type(this.itemType),
    };
  }

  display() {
    return this.itemType.display();
  }

  override defaultFormInputCode() {
    return this.itemType.defaultFormInputCode();
  }
  override defaultFormInputType() {
    return this.itemType.defaultFormInputType();
  }
}

export function tTagged<T>(itemType: Type<T>) {
  return new TTagged(itemType);
}