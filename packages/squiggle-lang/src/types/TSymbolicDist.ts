import { BaseSymbolicDist } from "../dists/SymbolicDist/BaseSymbolicDist.js";
import { SymbolicDist } from "../dists/SymbolicDist/index.js";
import { Value, vDist } from "../value/index.js";
import { Type } from "./Type.js";

export class TSymbolicDist extends Type<SymbolicDist> {
  unpack(v: Value) {
    return v.type === "Dist" && v.value instanceof BaseSymbolicDist
      ? v.value
      : undefined;
  }

  pack(v: SymbolicDist) {
    return vDist(v);
  }

  override defaultFormInputCode() {
    return "Sym.normal(1,1)";
  }
}

export const tSymbolicDist = new TSymbolicDist();
