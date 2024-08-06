import { SDate } from "../utility/SDate.js";
import { Value, vDate } from "../value/index.js";
import { SerializedType } from "./serialize.js";
import { Type } from "./Type.js";

export class TDate extends Type<SDate> {
  unpack(v: Value) {
    return v.type === "Date" ? v.value : undefined;
  }

  pack(v: SDate) {
    return vDate(v);
  }

  override serialize(): SerializedType {
    return { kind: "Date" };
  }

  override defaultFormInputCode(): string {
    return "Date(2023)";
  }
}

export const tDate = new TDate();
