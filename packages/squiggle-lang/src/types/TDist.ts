import { BaseDist } from "../dists/BaseDist.js";
import { Value, vDist } from "../value/index.js";
import { Type } from "./Type.js";

export class TDist extends Type<BaseDist> {
  unpack(v: Value) {
    return v.type === "Dist" ? v.value : undefined;
  }

  pack(v: BaseDist) {
    return vDist(v);
  }

  override defaultFormInputCode() {
    return "normal(1,1)";
  }
}

export const tDist = new TDist();
