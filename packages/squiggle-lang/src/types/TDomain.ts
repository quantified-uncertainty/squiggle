import { type Domain } from "../domains/index.js";
import { Value, vDomain } from "../value/index.js";
import { Type } from "./Type.js";

export class TDomain extends Type<Domain> {
  unpack(v: Value) {
    return v.type === "Domain" ? v.value : undefined;
  }

  pack(v: Domain) {
    return vDomain(v);
  }
}

export const tDomain = new TDomain();
