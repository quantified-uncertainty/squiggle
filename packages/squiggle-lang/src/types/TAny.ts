import { Value } from "../value/index.js";
import { Type } from "./Type.js";

export class TAny extends Type<Value> {
  constructor(public genericName?: string) {
    super();
  }

  unpack(v: Value) {
    return v;
  }

  pack(v: Value) {
    return v;
  }

  override display() {
    return this.genericName ? `'${this.genericName}` : "any";
  }

  override isTransparent() {
    return true;
  }
}

export function tAny(params?: { genericName?: string }) {
  return new TAny(params?.genericName);
}
