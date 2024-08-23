import { Value } from "../value/index.js";
import { InputType } from "../value/VInput.js";
import { Type } from "./Type.js";

export type IntrinsicValueType = Exclude<
  Value["type"],
  "Void" | "Array" | "Dict" | "Dist"
>;

export class TIntrinsic<T extends IntrinsicValueType> extends Type {
  public valueType: T;
  private _defaultFormInputType: InputType;
  private _defaultFormInputCode: string;
  private _display: string;

  constructor(params: {
    valueType: T;
    defaultFormInputCode?: string;
    defaultFormInputType?: InputType;
    display?: string;
  }) {
    super();
    this.valueType = params.valueType;
    this._defaultFormInputCode = params.defaultFormInputCode ?? "";
    this._defaultFormInputType = params.defaultFormInputType ?? "text";
    this._display = params.display ?? this.valueType;
  }

  check(v: Value) {
    return v.type === this.valueType;
  }

  serialize() {
    return { kind: "Intrinsic", valueType: this.valueType } as const;
  }

  override defaultFormInputCode() {
    return this._defaultFormInputCode;
  }

  override defaultFormInputType() {
    return this._defaultFormInputType;
  }

  toString() {
    return this._display;
  }
}

export const tNumber = new TIntrinsic({
  valueType: "Number",
  defaultFormInputCode: "0",
});

export const tString = new TIntrinsic({
  valueType: "String",
});

export const tBool = new TIntrinsic({
  valueType: "Bool",
  defaultFormInputCode: "false",
  defaultFormInputType: "checkbox",
});

export const tCalculator = new TIntrinsic({
  valueType: "Calculator",
  defaultFormInputType: "textArea",
});

export const tInput = new TIntrinsic({
  valueType: "Input",
  defaultFormInputType: "textArea",
});

export const tScale = new TIntrinsic({
  valueType: "Scale",
});

export const tTableChart = new TIntrinsic({
  valueType: "TableChart",
  display: "Table",
});

export const tDate = new TIntrinsic({
  valueType: "Date",
  defaultFormInputCode: "Date(2024)",
});

export const tDuration = new TIntrinsic({
  valueType: "Duration",
  defaultFormInputCode: "1minutes",
});

export const tPlot = new TIntrinsic({
  valueType: "Plot",
  defaultFormInputType: "textArea",
});

export const tSpecification = new TIntrinsic({
  valueType: "Specification",
});

export const tLambda = new TIntrinsic({
  valueType: "Lambda",
  defaultFormInputCode: "{|e| e}",
});

export const tDomain = new TIntrinsic({
  valueType: "Domain",
});
