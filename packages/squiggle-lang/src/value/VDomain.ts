import { DateRangeDomain } from "../domains/DateRangeDomain.js";
import { Domain } from "../domains/index.js";
import { NumericRangeDomain } from "../domains/NumberRangeDomain.js";
import {
  deserializeDomain,
  SerializedDomain,
  serializeDomain,
} from "../domains/serialize.js";
import { REOther } from "../errors/messages.js";
import { SDate } from "../utility/SDate.js";
import { BaseValue } from "./BaseValue.js";
import { Value } from "./index.js";
import { Indexable } from "./mixins.js";
import { vDate, VDate } from "./VDate.js";
import { vNumber, VNumber } from "./VNumber.js";

function domainIsEqual(valueA: Domain, valueB: Domain) {
  if (valueA.kind !== valueB.kind) {
    return false;
  }
  switch (valueA.kind) {
    case "DateRange":
      return (valueA as DateRangeDomain).isEqual(valueB as DateRangeDomain);
    case "NumericRange":
      return (valueA as NumericRangeDomain).isEqual(
        valueB as NumericRangeDomain
      );
    default:
      return false;
  }
}

export class VDomain
  extends BaseValue<"Domain", SerializedDomain>
  implements Indexable
{
  readonly type = "Domain";

  constructor(public value: Domain) {
    super();
  }

  valueToString(): string {
    return this.value.toString();
  }

  get domainType() {
    return this.value.type;
  }

  get(key: Value): VNumber | VDate {
    if (this.value.kind === "NumericRange" || this.value.kind === "DateRange") {
      const mapValue = (value: number | SDate) =>
        typeof value === "number" ? vNumber(value) : vDate(value);

      if (key.type === "String") {
        if (key.value === "min") {
          return mapValue(this.value.min);
        }
        if (key.value === "max") {
          return mapValue(this.value.max);
        }
      }
    }

    throw new REOther("Trying to access non-existent field");
  }

  isEqual(other: VDomain) {
    return domainIsEqual(this.value, other.value);
  }

  override serializePayload(): SerializedDomain {
    return serializeDomain(this.value);
  }

  static deserialize(payload: SerializedDomain): VDomain {
    return new VDomain(deserializeDomain(payload));
  }
}

export const vDomain = (domain: Domain) => new VDomain(domain);
