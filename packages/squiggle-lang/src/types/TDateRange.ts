import { SDate } from "../utility/SDate.js";
import { Value, vDate } from "../value/index.js";
import { VDate } from "../value/VDate.js";
import { Scale } from "../value/VScale.js";
import { SerializedType } from "./serialize.js";
import { TAny, Type } from "./Type.js";

export class TDateRange extends Type<SDate> {
  constructor(
    public min: SDate,
    public max: SDate
  ) {
    super();
  }

  check(v: Value): v is VDate {
    return Boolean(
      v.type === "Date" &&
        v.value.toMs() >= this.min.toMs() &&
        v.value.toMs() <= this.max.toMs()
    );
  }

  unpack(v: Value) {
    return this.check(v) ? v.value : undefined;
  }

  pack(v: SDate): Value {
    return vDate(v);
  }

  isSupertypeOf(other: Type): boolean {
    return (
      other instanceof TAny ||
      (other instanceof TDateRange &&
        // should this be <= and >= instead?
        this.min.toMs() === other.min.toMs() &&
        this.max.toMs() === other.max.toMs())
    );
  }

  serialize(): SerializedType {
    return { kind: "DateRange", min: this.min.toMs(), max: this.max.toMs() };
  }

  display() {
    return `Date.rangeDomain(${this.min.toString()}, ${this.max.toString()})`;
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "date" },
      min: this.min.toMs(),
      max: this.max.toMs(),
    };
  }
}
