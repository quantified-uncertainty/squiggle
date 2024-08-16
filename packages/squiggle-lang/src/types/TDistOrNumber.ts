import { BaseDist } from "../dists/BaseDist.js";
import { Value, vDist, vNumber } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { tDist, TDist } from "./TDist.js";
import { TIntrinsic } from "./TIntrinsic.js";
import { TAny, Type } from "./Type.js";

// TODO: It would probably eventually be good to refactor this out, to use frOr instead. However, that would be slightly less efficient.
export class TDistOrNumber extends Type<BaseDist | number> {
  check(v: Value): boolean {
    return this.unpack(v) !== undefined;
  }

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

  serialize(): SerializedType {
    return { kind: "DistOrNumber" };
  }

  isSupertypeOf(other: Type): boolean {
    return (
      other instanceof TAny ||
      other instanceof this.constructor ||
      other instanceof TDist ||
      (other instanceof TIntrinsic && other.valueType === "Number")
    );
  }

  display() {
    return "Dist|Number";
  }

  override defaultFormInputCode() {
    return tDist.defaultFormInputCode();
  }
}

export const tDistOrNumber = new TDistOrNumber();
