import isInteger from "lodash/isInteger.js";

import { ErrorMessage } from "../errors/messages.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { BaseValue } from "./BaseValue.js";
import { isEqual, Value } from "./index.js";
import { Indexable } from "./mixins.js";

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
    // For reference, for long types TypeScript returns the following error:

    // Argument of type '[number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, ... 38 more ..., number]' is not assignable to parameter of type '[number]'.

    // We want to limit both the string length and the number of items.
    // (To see why max items is not enough, consider a list that consists of long strings, or complex dicts)
    const maxTotalLengthBeforeTruncation = 150;
    const maxItemsBeforeTruncation = 20;
    const separator = ", ";

    const strings: string[] = [];
    let totalLength = 0;
    for (let i = 0; i < this.value.length; i++) {
      const str = this.value[i].toString();
      strings.push(str);
      totalLength += str.length;
      if (
        (totalLength >=
          maxTotalLengthBeforeTruncation + strings.length * separator.length ||
          strings.length >= maxItemsBeforeTruncation) &&
        i < this.value.length - 2 // at least one item to skip
      ) {
        // skip all items except the last one
        // example: for [0,1,2,3,4] we will get [0,1,2,"... 1 more ...",4]
        // so we skip 5 - (2 + 2) = 1 element
        strings.push(`... ${this.value.length - (i + 2)} more ...`);
        // always add the last item
        strings.push(this.value[this.value.length - 1].toString());
        break;
      }
    }
    return "[" + strings.join(separator) + "]";
  }

  get(key: Value) {
    if (key.type === "Number") {
      if (!isInteger(key.value)) {
        throw ErrorMessage.arrayIndexNotFoundError(
          "Array index must be an integer",
          key.value
        );
      }
      const index = key.value | 0;
      if (index >= 0 && index < this.value.length) {
        return this.value[index];
      } else {
        throw ErrorMessage.arrayIndexNotFoundError(
          "Array index not found",
          index
        );
      }
    }

    throw ErrorMessage.otherError("Can't access non-numerical key on an array");
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

  override serializePayload(
    visit: SquiggleSerializationVisitor
  ): SerializedArray {
    return this.value.map((element) => visit.value(element));
  }

  static deserialize(
    serializedValue: SerializedArray,
    visit: SquiggleDeserializationVisitor
  ): VArray {
    return new VArray(serializedValue.map((value) => visit.value(value)));
  }
}
export const vArray = (v: readonly Value[]) => new VArray(v);
