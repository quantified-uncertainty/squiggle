import { BaseValue } from "./BaseValue.js";

export class VVoid extends BaseValue {
  readonly type = "Void";

  constructor() {
    super();
  }

  valueToString() {
    return "()";
  }

  isEqual(other: VVoid) {
    return true;
  }
}

export const vVoid = () => new VVoid();
