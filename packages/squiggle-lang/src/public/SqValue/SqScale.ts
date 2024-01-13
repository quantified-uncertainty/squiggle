import { SDate } from "../../utility/SDate.js";
import {
  mergeScale,
  methodWithDefaultParams,
  Scale,
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
      method: scale.method ? methodWithDefaultParams(scale.method) : undefined,
    };
  }

  static linearDefault() {
    return new SqScale({ method: { type: "linear" } });
  }

  merge(other: SqScale) {
    return wrapScale(mergeScale(this._value, other._value));
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

  get method() {
    return this._value.method;
  }

  numberToValue(v: number): SqValue {
    return this._value.method?.type === "date"
      ? SqDateValue.create(SDate.fromMs(v))
      : SqNumberValue.create(v);
  }
}
