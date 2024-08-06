import { SquiggleSerializationVisitor } from "../serialization/squiggle.js";
import { Value } from "../value/index.js";
import { Input, InputType, vInput } from "../value/VInput.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TInput extends Type<Input> {
  unpack(v: Value) {
    return v.type === "Input" ? v.value : undefined;
  }

  pack(v: Input) {
    return vInput(v);
  }

  override serialize(visit: SquiggleSerializationVisitor): SerializedType {
    return { kind: "Input" };
  }

  override defaultFormInputType(): InputType {
    return "textArea";
  }
}

export const tInput = new TInput();
