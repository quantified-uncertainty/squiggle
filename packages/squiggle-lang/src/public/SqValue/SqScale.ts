import { SDate } from "../../utility/SDate.js";
import { Scale, vScale } from "../../value/index.js";
import { SqDateValue, SqNumberValue, SqValue } from "./index.js";

export const wrapScale = (value: Scale): SqScale => {
  return new SqScale(value);
};

export class SqScale {
  constructor(
    // public because of SqFnPlot.create
    public _value: Scale
  ) {}

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

//     this._constant = args.constant ?? SCALE_SYMLOG_DEFAULT_CONSTANT;
//     this._exponent = args.exponent ?? SCALE_POWER_DEFAULT_CONSTANT;
//   }
