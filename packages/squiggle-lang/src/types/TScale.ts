import { Value } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { Scale, vScale } from "../value/VScale.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TScale extends Type<Scale> {
  unpack(v: Value) {
    return v.type === "Scale" ? v.value : undefined;
  }

  pack(v: Scale) {
    return vScale(v);
  }

  override serialize(): SerializedType {
    return { kind: "Scale" };
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }
}

export const tScale = new TScale();
