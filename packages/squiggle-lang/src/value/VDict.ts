import { REDictPropertyNotFound, REOther } from "../errors/messages.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { BaseValue } from "./BaseValue.js";
import { isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";

type ValueMap = ImmutableMap<string, Value>;

export class VDict extends BaseValue implements Indexable {
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
}

export const vDict = (v: ValueMap) => new VDict(v);
