import { BaseDist } from "../dists/BaseDist.js";
import { Value, vDist, vNumber } from "../value/index.js";
import { tDist, TDist } from "./TDist.js";
import { TNumber } from "./TNumber.js";
import { TAny, Type } from "./Type.js";

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

  override isSupertype(other: Type<unknown>): boolean {
    return (
      other instanceof TAny ||
      other instanceof this.constructor ||
      other instanceof TDist ||
      other instanceof TNumber
    );
  }

  override display() {
    return "Dist|Number";
  }

  override defaultFormInputCode() {
    return tDist.defaultFormInputCode();
  }
}

export const tDistOrNumber = new TDistOrNumber();
