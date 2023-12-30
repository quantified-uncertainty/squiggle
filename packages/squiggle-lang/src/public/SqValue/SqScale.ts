import { SDate } from "../../utility/SDate.js";
import {
  Scale,
  scaleShiftWithDefaultParams,
  vScale,
} from "../../value/index.js";
import { SqDateValue, SqNumberValue, SqValue } from "./index.js";

export const wrapScale = (value: Scale): SqScale => {
  return new SqScale(value);
};

export class SqScale {
  public _value: Scale;
  constructor(scale: Scale) {
    this._value = {
      ...scale,
      scaleShift: scale.scaleShift
        ? scaleShiftWithDefaultParams(scale.scaleShift)
        : undefined,
    };
  }

  static linearDefault() {
    return new SqScale({ scaleShift: { type: "linear" } });
  }

  toString() {
    return vScale(this._value).toString();
  }

  get min() {
    return this._value.min;
  }

  get max() {
    return this._value.max;
  }

  get tickFormat() {
    return this._value.tickFormat;
  }

  get title() {
    return this._value.title;
  }

  get scaleShift() {
    return this._value.scaleShift;
  }

  numberToValue(v: number): SqValue {
    return this._value.scaleShift?.type === "date"
      ? SqDateValue.create(SDate.fromMs(v))
      : SqNumberValue.create(v);
  }
}
