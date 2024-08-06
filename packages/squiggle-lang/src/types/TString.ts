import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value, vString } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TString extends Type<string> {
  unpack(v: Value) {
    return v.type === "String" ? v.value : undefined;
  }

  pack(v: string) {
    return vString(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "String" };
  }
}

export const tString = new TString();
