import { SDate } from "../utility/SDate.js";
import { Value } from "../value/index.js";
import { VDate } from "../value/VDate.js";
import { Scale } from "../value/VScale.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TDateRange extends Type {
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

  serialize(): SerializedType {
    return { kind: "DateRange", min: this.min.toMs(), max: this.max.toMs() };
  }

  toString() {
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
