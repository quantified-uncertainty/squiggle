import { BaseDist } from "../dists/BaseDist.js";
import { Value, vDist, vNumber } from "../value/index.js";
import { tDist } from "./TDist.js";
import { Type } from "./Type.js";

// TODO: It would probably eventually be good to refactor this out, to use frOr instead. However, that would be slightly less efficient.
export class TDistOrNumber extends Type<BaseDist | number> {
  unpack(v: Value) {
    return v.type === "Dist"
      ? v.value
      : v.type === "Number"
        ? v.value
        : undefined;
  }

  pack(v: BaseDist | number) {
    return typeof v === "number" ? vNumber(v) : vDist(v);
  }

  override display() {
    return "Dist|Number";
  }

  override defaultFormInputCode() {
    return tDist.defaultFormInputCode();
  }
}

export const tDistOrNumber = new TDistOrNumber();