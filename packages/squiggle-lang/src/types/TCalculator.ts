import { Value } from "../value/index.js";
import { Calculator, vCalculator } from "../value/VCalculator.js";
import { Type } from "./Type.js";

export class TCalculator extends Type<Calculator> {
  unpack(v: Value) {
    return v.type === "Calculator" ? v.value : undefined;
  }

  pack(v: Calculator) {
    return vCalculator(v);
  }

  override defaultFormInputType() {
    return "textArea" as const;
  }
}

export const tCalculator = new TCalculator();