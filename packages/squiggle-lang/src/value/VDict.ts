import { REDictPropertyNotFound, REOther } from "../errors/messages.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { BaseValue } from "./BaseValue.js";
import { isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";

type ValueMap = ImmutableMap<string, Value>;

type SerializedDict = [string, number][];

export class VDict
  extends BaseValue<"Dict", SerializedDict>
  implements Indexable
{
  readonly type = "Dict";

  override get publicName() {
    return "Dictionary";
  }

  constructor(public value: ValueMap) {
    super();
  }

  static empty() {
    return new VDict(ImmutableMap([]));
  }

  merge(other: VDict) {
    return new VDict(this.value.merge(other.value));
  }

  valueToString() {
    return (
      "{" +
      [...this.value.entries()]
        .map(([k, v]) => `${k}: ${v.toString()}`)
        .join(", ") +
      "}"
    );
  }

  get(key: Value) {
    if (key.type === "String") {
      const result = this.value.get(key.value);
      if (!result) {
        throw new REDictPropertyNotFound("Dict property not found", key.value);
      }
      return result;
    } else {
      throw new REOther("Can't access non-string key on a dict");
    }
  }

  //Can't change ``get`` directly, because it's needed for the ``Indexable`` mixin
  safeGet(key: string): Value | undefined {
    return this.value.get(key);
  }

  isEqual(other: VDict): boolean {
    if (this.value.size !== other.value.size) {
      return false;
    }

    for (const [key, valueA] of this.value.entries()) {
      const valueB = other.value.get(key);

      // Check if key exists in the other dictionary
      if (!valueB) {
        return false;
      }

      // Compare the values associated with the key
      if (!isEqual(valueA, valueB)) {
        return false;
      }
    }

    return true;
  }

  isEmpty(): boolean {
    return this.value.isEmpty();
  }

  size(): number {
    return this.value.size;
  }

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedDict {
    return [...this.value.entries()].map(([k, v]) => [k, visit.value(v)]);
  }

  static deserialize(
    payload: SerializedDict,
    visit: SquiggleDeserializationVisitor
  ) {
    return new VDict(
      ImmutableMap(payload.map(([k, v]) => [k, visit.value(v)]))
    );
  }
}

export const vDict = (v: ValueMap) => new VDict(v);
export const vDictFromArray = (v: [string, Value][]) => vDict(ImmutableMap(v));
