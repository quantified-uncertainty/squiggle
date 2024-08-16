import { Value } from "../value/index.js";
import { VBool } from "../value/VBool.js";
import { VCalculator } from "../value/VCalculator.js";
import { VDate } from "../value/VDate.js";
import { VDuration } from "../value/VDuration.js";
import { InputType, VInput } from "../value/VInput.js";
import { VLambda } from "../value/vLambda.js";
import { VNumber } from "../value/VNumber.js";
import { VPlot } from "../value/VPlot.js";
import { VScale } from "../value/VScale.js";
import { VSpecification } from "../value/VSpecification.js";
import { VString } from "../value/VString.js";
import { VTableChart } from "../value/VTableChart.js";
import { Type } from "./Type.js";

export type IntrinsicValueType = Exclude<
  Value["type"],
  "Void" | "Array" | "Dict" | "Dist" | "Domain"
>;

export type ValueClass<T extends IntrinsicValueType> = {
  new (...args: any[]): Extract<Value, { type: T }>;
};

export class TIntrinsic<T extends IntrinsicValueType> extends Type<
  InstanceType<ValueClass<T>>["value"]
> {
  public valueType: T;
  public valueClass: ValueClass<T>;
  private _defaultFormInputType: InputType;
  private _defaultFormInputCode: string;
  private _display: string;

  constructor(params: {
    valueType: T;
    valueClass: ValueClass<T>;
    defaultFormInputCode?: string;
    defaultFormInputType?: InputType;
    display?: string;
  }) {
    super();
    this.valueType = params.valueType;
    this.valueClass = params.valueClass;
    this._defaultFormInputCode = params.defaultFormInputCode ?? "";
    this._defaultFormInputType = params.defaultFormInputType ?? "text";
    this._display = params.display ?? this.valueType;
  }

  override check(v: Value) {
    return v.type === this.valueType;
  }

  unpack(v: Value) {
    return v.type === this.valueType
      ? (v.value as InstanceType<ValueClass<T>>["value"])
      : undefined;
  }

  pack(v: InstanceType<ValueClass<T>>["value"]) {
    return new this.valueClass(v);
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

  override display(): string {
    return this._display;
  }
}

export const tNumber = new TIntrinsic({
  valueType: "Number",
  valueClass: VNumber,
  defaultFormInputCode: "0",
});

export const tString = new TIntrinsic({
  valueType: "String",
  valueClass: VString,
});

export const tBool = new TIntrinsic({
  valueType: "Bool",
  valueClass: VBool,
  defaultFormInputCode: "false",
  defaultFormInputType: "checkbox",
});

export const tCalculator = new TIntrinsic({
  valueType: "Calculator",
  valueClass: VCalculator,
  defaultFormInputType: "textArea",
});

export const tInput = new TIntrinsic({
  valueType: "Input",
  valueClass: VInput,
  defaultFormInputType: "textArea",
});

export const tScale = new TIntrinsic({
  valueType: "Scale",
  valueClass: VScale,
});

export const tTableChart = new TIntrinsic({
  valueType: "TableChart",
  valueClass: VTableChart,
  display: "Table",
});

export const tDate = new TIntrinsic({
  valueType: "Date",
  valueClass: VDate,
  defaultFormInputCode: "Date(2024)",
});

export const tDuration = new TIntrinsic({
  valueType: "Duration",
  valueClass: VDuration,
  defaultFormInputCode: "1minutes",
});

export const tPlot = new TIntrinsic({
  valueType: "Plot",
  valueClass: VPlot,
  defaultFormInputType: "textArea",
});

export const tSpecification = new TIntrinsic({
  valueType: "Specification",
  valueClass: VSpecification,
});

export const tLambda = new TIntrinsic({
  valueType: "Lambda",
  valueClass: VLambda,
  defaultFormInputCode: "{|e| e}",
});
