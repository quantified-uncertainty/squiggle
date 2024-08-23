import lodashIsEqual from "lodash/isEqual.js";

import { BaseValue } from "./BaseValue.js";

export type CommonInputArgs = {
  name: string;
  typeName?: string;
  description?: string;
};

export type FormInput = CommonInputArgs &
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
export class VInput extends BaseValue<"Input", FormInput> {
  readonly type = "Input";

  constructor(public value: FormInput) {
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

  override serializePayload(): FormInput {
    return this.value;
  }

  static deserialize(value: FormInput): VInput {
    return vInput(value);
  }
}

export function vInput(input: FormInput) {
  return new VInput(input);
}
