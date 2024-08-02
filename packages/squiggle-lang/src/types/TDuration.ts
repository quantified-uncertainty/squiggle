import { SDuration } from "../utility/SDuration.js";
import { Value, vDuration } from "../value/index.js";
import { Type } from "./Type.js";

export class TDuration extends Type<SDuration> {
  unpack(v: Value) {
    return v.type === "Duration" ? v.value : undefined;
  }

  pack(v: SDuration) {
    return vDuration(v);
  }

  override defaultFormInputCode(): string {
    return "1minutes";
  }
}

export const tDuration = new TDuration();
