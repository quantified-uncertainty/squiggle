import { Scale, vScale } from "../value/index.js";
import { SqScaleValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export const wrapScale = (value: Scale, location: SqValueLocation): SqScale => {
  switch (value.type) {
    case "linear":
      return new SqLinearScale(value, location);
  }
};

abstract class SqAbstractScale<T extends Scale["type"]> {
  abstract tag: T;

  constructor(
    protected _value: Extract<Scale, { type: T }>,
    public location: SqValueLocation
  ) {}

  toString() {
    return vScale(this._value).toString();
  }

  asValue() {
    return new SqScaleValue(vScale(this._value), this.location);
  }
}

export class SqLinearScale extends SqAbstractScale<"linear"> {
  tag = "linear" as const;
}

export type SqScale = SqLinearScale;
