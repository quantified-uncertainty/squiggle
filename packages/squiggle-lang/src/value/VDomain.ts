import { ErrorMessage } from "../errors/messages.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { typesAreEqual } from "../types/helpers.js";
import { TDateRange } from "../types/TDateRange.js";
import { TNumberRange } from "../types/TNumberRange.js";
import { Type } from "../types/Type.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vDate, VDate } from "./VDate.js";
import { vNumber, VNumber } from "./VNumber.js";

export class VDomain extends BaseValue<"Domain", number> implements Indexable {
  readonly type = "Domain";

  constructor(public value: Type) {
    super();
  }

  valueToString(): string {
    return this.value.toString();
  }

  get(key: Value): VNumber | VDate {
    if (this.value instanceof TNumberRange) {
      if (key.type === "String") {
        if (key.value === "min") {
          return vNumber(this.value.min);
        }
        if (key.value === "max") {
          return vNumber(this.value.max);
        }
      }
    } else if (this.value instanceof TDateRange) {
      if (key.type === "String") {
        if (key.value === "min") {
          return vDate(this.value.min);
        }
        if (key.value === "max") {
          return vDate(this.value.max);
        }
      }
    }

    throw ErrorMessage.otherError("Trying to access non-existent field");
  }

  isEqual(other: VDomain) {
    return typesAreEqual(this.value, other.value);
  }

  override serializePayload(visit: SquiggleSerializationVisitor) {
    return visit.type(this.value);
  }

  static deserialize(payload: number, visit: SquiggleDeserializationVisitor) {
    return new VDomain(visit.type(payload));
  }
}

export function vDomain(domain: Type) {
  return new VDomain(domain);
}
