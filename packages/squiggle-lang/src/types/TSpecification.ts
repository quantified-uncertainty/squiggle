import { Value } from "../value/index.js";
import { Specification, vSpecification } from "../value/VSpecification.js";
import { Type } from "./Type.js";

export class TSpecification extends Type<Specification> {
  unpack(v: Value) {
    return v.type === "Specification" ? v.value : undefined;
  }

  pack(v: Specification) {
    return vSpecification(v);
  }
}

export const tSpecification = new TSpecification();
