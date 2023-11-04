import { Input, vInput } from "../../value/index.js";

export const wrapInput = (value: Input): SqInput => {
  switch (value.type) {
    case "text":
      return new SqTextInput(value);
    case "textArea":
      return new SqTextAreaInput(value);
    case "checkbox":
      return new SqCheckboxInput(value);
    case "select":
      return new SqSelectInput(value);
  }
};

abstract class SqAbstractInput<T extends Input["type"]> {
  abstract tag: T;

  constructor(public _value: Extract<Input, { type: T }>) {}

  toString() {
    return vInput(this._value).toString();
  }

  get name() {
    return this._value.name;
  }

  get description() {
    return this._value.description;
  }

  get default() {
    return this._value.default;
  }
}

export class SqTextInput extends SqAbstractInput<"text"> {
  tag = "text" as const;
}

export class SqTextAreaInput extends SqAbstractInput<"textArea"> {
  tag = "textArea" as const;
}

export class SqCheckboxInput extends SqAbstractInput<"checkbox"> {
  tag = "checkbox" as const;
}

export class SqSelectInput extends SqAbstractInput<"select"> {
  tag = "select" as const;

  get options() {
    return this._value.options;
  }
}

export type SqInput =
  | SqTextInput
  | SqTextAreaInput
  | SqSelectInput
  | SqCheckboxInput;
