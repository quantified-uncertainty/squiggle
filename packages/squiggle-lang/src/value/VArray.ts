import isInteger from "lodash/isInteger.js";

import { REArrayIndexNotFound, REOther } from "../errors/messages.js";
import { BaseValue } from "./BaseValue.js";
import { isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { SerializationStorage } from "./serialize.js";

// list of value ids
type SerializedArray = number[];

export class VArray
  extends BaseValue<"Array", SerializedArray>
  implements Indexable
{
  readonly type = "Array";

  override get publicName() {
    return "List";
  }

  constructor(public value: readonly Value[]) {
    super();
  }

  valueToString() {
    return "[" + this.value.map((v) => v.toString()).join(",") + "]";
  }

  get(key: Value) {
    if (key.type === "Number") {
      if (!isInteger(key.value)) {
        throw new REArrayIndexNotFound(
          "Array index must be an integer",
          key.value
        );
      }
      const index = key.value | 0;
      if (index >= 0 && index < this.value.length) {
        return this.value[index];
      } else {
        throw new REArrayIndexNotFound("Array index not found", index);
      }
    }

    throw new REOther("Can't access non-numerical key on an array");
  }

  isEqual(other: VArray) {
    if (this.value.length !== other.value.length) {
      return false;
    }

    for (let i = 0; i < this.value.length; i++) {
      const _isEqual = isEqual(this.value[i], other.value[i]);
      if (!_isEqual) {
        return false;
      }
    }
    return true;
  }

  override serializePayload(storage: SerializationStorage): SerializedArray {
    return this.value.map((element) => storage.serializeValue(element));
  }

  static deserialize(
    serializedValue: SerializedArray,
    load: (id: number) => Value
  ): VArray {
    return new VArray(serializedValue.map(load));
  }
}
export const vArray = (v: readonly Value[]) => new VArray(v);
