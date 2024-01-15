import isInteger from "lodash/isInteger.js";

import { REArrayIndexNotFound, REOther } from "../errors/messages.js";
import { BaseValue, isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";

export class VArray extends BaseValue implements Indexable {
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
}
export const vArray = (v: readonly Value[]) => new VArray(v);
