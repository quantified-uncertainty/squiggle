import { Value, vString } from "../value/index.js";
import { Type } from "./Type.js";

export class TString extends Type<string> {
  unpack(v: Value) {
    return v.type === "String" ? v.value : undefined;
  }

  pack(v: string) {
    return vString(v);
  }
}

export const tString = new TString();
