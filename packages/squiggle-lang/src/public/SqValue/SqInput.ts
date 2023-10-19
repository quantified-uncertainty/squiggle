import { CommonInputArgs, Input, vInput } from "../../value/index.js";

export const wrapInput = (value: Input): SqInput => {
  switch (value.type) {
    case "text":
      return SqTextInput.create(value);
    case "textArea":
      return SqTextAreaInput.create(value);
    case "select":
      return SqSelectInput.create(value);
  }
};

abstract class SqAbstractInput<T extends Input["type"]> {
  abstract tag: T;

  constructor(
    // public because of SqFnPlot.create
    public _value: Extract<Input, { type: T }>
  ) {}

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

  static create(args: CommonInputArgs) {
    return new SqTextInput({ type: "text", description: "text", ...args });
  }
}

export class SqTextAreaInput extends SqAbstractInput<"textArea"> {
  tag = "textArea" as const;

  static create(args: CommonInputArgs) {
    return new SqTextAreaInput({ type: "textArea", ...args });
  }
}

export class SqSelectInput extends SqAbstractInput<"select"> {
  tag = "select" as const;
  private _options: string[];

  constructor(args: CommonInputArgs & { options: string[] }) {
    super({
      type: "select",
      ...args,
    });
    this._options = args.options;
  }

  get options() {
    return this._options;
  }

  static create(args: CommonInputArgs & { options: string[] }) {
    return new SqSelectInput(args);
  }
}

export type SqInput = SqTextInput | SqTextAreaInput | SqSelectInput;
