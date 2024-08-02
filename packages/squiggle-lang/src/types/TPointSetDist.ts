import { PointSetDist } from "../dists/PointSetDist.js";
import { Value, vDist } from "../value/index.js";
import { Type } from "./Type.js";

export class TPointSetDist extends Type<PointSetDist> {
  unpack(v: Value) {
    return v.type === "Dist" && v.value instanceof PointSetDist
      ? v.value
      : undefined;
  }

  pack(v: PointSetDist) {
    return vDist(v);
  }

  override defaultFormInputCode() {
    return "PointSet(normal(1,1))";
  }
}

export const tPointSetDist = new TPointSetDist();
