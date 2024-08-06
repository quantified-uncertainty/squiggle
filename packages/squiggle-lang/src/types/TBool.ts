import { Value, vBool } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TBool extends Type<boolean> {
  unpack(v: Value) {
    return v.type === "Bool" ? v.value : undefined;
  }

  pack(v: boolean) {
    return vBool(v);
  }

  override serialize(): SerializedType {
    return { kind: "Bool" };
  }

  override defaultFormInputCode() {
    return "false";
  }

  override defaultFormInputType() {
    return "checkbox" as const;
  }
}

export const tBool = new TBool();
