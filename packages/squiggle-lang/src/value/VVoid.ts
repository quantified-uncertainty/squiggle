import { BaseValue } from "./BaseValue.js";

export class VVoid extends BaseValue<"Void", null> {
  readonly type = "Void";

  constructor() {
    super();
  }

  valueToString() {
    return "()";
  }

  override serializePayload() {
    return null;
  }

  static deserialize() {
    return vVoid();
  }
}

export const vVoid = () => new VVoid();
