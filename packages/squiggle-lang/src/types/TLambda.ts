import { Lambda } from "../reducer/lambda/index.js";
import { Value, vLambda } from "../value/index.js";
import { Type } from "./Type.js";

export class TLambda extends Type<Lambda> {
  unpack(v: Value) {
    return v.type === "Lambda" ? v.value : undefined;
  }

  pack(v: Lambda) {
    return vLambda(v);
  }

  override display() {
    return "Function";
  }

  override defaultFormInputCode() {
    return "{|e| e}";
  }
}

export const tLambda = new TLambda();
