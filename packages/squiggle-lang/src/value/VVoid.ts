import { BaseValue } from "./index.js";

export class VVoid extends BaseValue {
  readonly type = "Void";

  constructor() {
    super();
  }
  valueToString() {
    return "()";
  }
}
export const vVoid = () => new VVoid();
