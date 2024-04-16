import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { JsonValue } from "../utility/typeHelpers.js";
import { SerializedValue } from "./index.js";
import { ValueTags, ValueTagsType } from "./valueTags.js";

/*
Value classes are shaped in a similar way and can work as discriminated unions thank to the `type` property.

`type` property is currently stored on instances; that creates some memory overhead, but it's hard to store it in prototype in a type-safe way.

Also, it's important that `type` is declared as readonly (or `as const`, but readonly is enough); otherwise unions won't work properly.

If you add a new value class, don't forget to add it to the "Value" union type below.

"vBlah" functions are just for the sake of brevity, so that we don't have to prefix any value creation with "new".
*/
export abstract class BaseValue<
  Type extends string,
  SerializedPayload extends JsonValue, // this guarantees that the payload is JSON-serializable
> {
  abstract type: Type;
  readonly tags: ValueTags | undefined;

  // This is a getter, not a field, for performance reasons.
  get publicName(): string {
    return this.type;
  }

  getTags() {
    return this.tags ?? new ValueTags({});
  }

  copyWithTags(tags: ValueTags) {
    return Object.assign(Object.create(Object.getPrototypeOf(this)), {
      ...this,
      tags,
    });
  }

  mergeTags(args: ValueTagsType) {
    return this.copyWithTags(this.tags?.merge(args) ?? new ValueTags(args));
  }

  protected abstract valueToString(): string;

  toString() {
    const valueString = this.valueToString();
    if (!this.tags || this.tags.isEmpty()) {
      return valueString;
    }
    const argsStr = `{${this.tags.toString()}}`;
    return `${valueString}, with tags ${argsStr}`;
  }

  abstract serializePayload(
    visitor: SquiggleSerializationVisitor
  ): SerializedPayload;

  serialize(visitor: SquiggleSerializationVisitor): SerializedValue {
    return {
      type: this.type,
      payload: this.serializePayload(visitor),
    } as SerializedValue;
  }

  // Deserialization is implemented outside of this class; abstract static methods are not supported in TypeScript.
}
