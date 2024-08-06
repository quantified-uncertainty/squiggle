import { SDate } from "../utility/SDate.js";
import { Value } from "../value/index.js";
import { Scale } from "../value/VScale.js";
import { SerializedType } from "./serialize.js";
import { TDate } from "./TDate.js";

export class TDateRange extends TDate {
  constructor(
    public min: SDate,
    public max: SDate
  ) {
    super();
  }

  override unpack(v: Value) {
    return v.type === "Date" &&
      v.value.toMs() >= this.min.toMs() &&
      v.value.toMs() <= this.max.toMs()
      ? v.value
      : undefined;
  }

  override display(): string {
    return `Date.rangeDomain(${this.min.toString()}, ${this.max.toString()})`;
  }

  override serialize(): SerializedType {
    return { kind: "DateRange", min: this.min.toMs(), max: this.max.toMs() };
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "date" },
      min: this.min.toMs(),
      max: this.max.toMs(),
    };
  }
}
