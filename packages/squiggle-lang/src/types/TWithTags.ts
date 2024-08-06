import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { ValueTags } from "../value/valueTags.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TWithTags<T> extends Type<{ value: T; tags: ValueTags }> {
  constructor(public itemType: Type<T>) {
    super();
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

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return {
      kind: "WithTags",
      itemType: visit.type(this.itemType),
    };
  }

  override display() {
    return this.itemType.display();
  }

  override defaultFormInputCode() {
    return this.itemType.defaultFormInputCode();
  }
  override defaultFormInputType() {
    return this.itemType.defaultFormInputType();
  }
}

export function tWithTags<T>(itemType: Type<T>) {
  return new TWithTags(itemType);
}
