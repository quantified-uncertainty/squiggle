import { Value } from "../value/index.js";
import { Scale } from "../value/VScale.js";
import { TNumber } from "./TNumber.js";

export class TNumberRange extends TNumber {
  constructor(
    public min: number,
    public max: number
  ) {
    super();
  }

  override unpack(v: Value) {
    return v.type === "Number" && v.value >= this.min && v.value <= this.max
      ? v.value
      : undefined;
  }

  override display(): string {
    return `Number.rangeDomain(${this.min}, ${this.max})`;
  }

  toDefaultScale(): Scale {
    return {
      method: { type: "linear" },
      min: this.min,
      max: this.max,
    };
  }
}
