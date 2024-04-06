import { BaseValue } from "./BaseValue.js";

export class VVoid extends BaseValue<"Void", null> {
  readonly type = "Void";

  constructor() {
    super();
  }

  valueToString() {
    return "()";
  }

  override serialize() {
    return null;
  }

  static deserialize() {
    return vVoid();
  }
}

export const vVoid = () => new VVoid();
