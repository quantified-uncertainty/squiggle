import { Value, vNumber } from "../value/index.js";
import { Type } from "./Type.js";

export class TNumber extends Type<number> {
  unpack(v: Value) {
    return v.type === "Number" ? v.value : undefined;
  }

  pack(v: number) {
    return vNumber(v);
  }

  override defaultFormInputCode() {
    return "0";
  }
}

export const tNumber = new TNumber();
