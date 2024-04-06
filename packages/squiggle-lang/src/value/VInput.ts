import lodashIsEqual from "lodash/isEqual.js";

import { BaseValue } from "./BaseValue.js";

export type CommonInputArgs = {
  name: string;
  typeName?: string;
  description?: string;
};

export type Input = CommonInputArgs &
  (
    | {
        type: "text";
        default?: string;
      }
    | {
        type: "textArea";
        default?: string;
      }
    | {
        type: "checkbox";
        default?: boolean;
      }
    | {
        type: "select";
        default?: string;
        options: readonly string[];
      }
  );

export type InputType = "text" | "textArea" | "checkbox" | "select";
export class VInput extends BaseValue<"Input", Input> {
  readonly type = "Input";

  constructor(public value: Input) {
    super();
  }

  valueToString() {
    switch (this.value.type) {
      case "text":
        return "Text input";
      case "textArea":
        return "Text area input";
      case "checkbox":
        return "Check box input";
      case "select":
        return `Select input (${this.value.options.join(", ")})`;
    }
  }

  isEqual(other: VInput) {
    return lodashIsEqual(this.value, other.value);
  }

  override serialize(): Input {
    return this.value;
  }

  static deserialize(value: Input): VInput {
    return vInput(value);
  }
}

export const vInput = (input: Input) => new VInput(input);
