import { SampleSetDist } from "../dists/SampleSetDist/index.js";
import { Value, vDist } from "../value/index.js";
import { Type } from "./Type.js";

export class TSampleSetDist extends Type<SampleSetDist> {
  unpack(v: Value) {
    return v.type === "Dist" && v.value instanceof SampleSetDist
      ? v.value
      : undefined;
  }

  pack(v: SampleSetDist) {
    return vDist(v);
  }

  override defaultFormInputCode() {
    return "normal(1,1)";
  }
}

export const tSampleSetDist = new TSampleSetDist();
