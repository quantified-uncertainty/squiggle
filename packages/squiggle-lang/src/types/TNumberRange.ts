import { Value } from "../value/index.js";
import { VNumber } from "../value/VNumber.js";
import { Scale } from "../value/VScale.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TNumberRange extends Type {
  constructor(
    public min: number,
    public max: number
  ) {
    super();
  }

  check(v: Value): v is VNumber {
    return v.type === "Number" && v.value >= this.min && v.value <= this.max;
  }

  serialize(): SerializedType {
    return {
      kind: "NumberRange",
      min: this.min,
      max: this.max,
    };
  }

  toString(): string {
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
