import { REOther } from "../errors/messages.js";
import {
  SquiggleDeserializationVisitor,
  SquiggleSerializationVisitor,
} from "../serialization/squiggle.js";
import { TDateRange } from "../types/TDateRange.js";
import { TNumberRange } from "../types/TNumberRange.js";
import { Type } from "../types/Type.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vDate, VDate } from "./VDate.js";
import { vNumber, VNumber } from "./VNumber.js";

function domainIsEqual(valueA: Type<unknown>, valueB: Type<unknown>) {
  return valueA.isSupertypeOf(valueB) && valueB.isSupertypeOf(valueA);
}

export class VDomain extends BaseValue<"Domain", number> implements Indexable {
  readonly type = "Domain";

  constructor(public value: Type<unknown>) {
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

    throw new REOther("Trying to access non-existent field");
  }

  isEqual(other: VDomain) {
    return domainIsEqual(this.value, other.value);
  }

  override serializePayload(visit: SquiggleSerializationVisitor) {
    return visit.type(this.value);
  }

  static deserialize(payload: number, visit: SquiggleDeserializationVisitor) {
    return new VDomain(visit.type(payload));
  }
}

export const vDomain = (domain: Type<unknown>) => new VDomain(domain);
