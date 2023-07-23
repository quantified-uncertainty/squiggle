import { CommonScaleArgs, Scale, vScale } from "../../value/index.js";

export const wrapScale = (value: Scale): SqScale => {
  switch (value.type) {
    case "linear":
      return new SqLinearScale(value);
    case "log":
      return new SqLogScale(value);
    case "symlog":
      return new SqSymlogScale(value);
    case "power":
      return new SqPowerScale(value);
  }
};

abstract class SqAbstractScale<T extends Scale["type"]> {
  abstract tag: T;

  constructor(
    // public because of SqFnPlot.create
    public _value: Extract<Scale, { type: T }>
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
}

export class SqLinearScale extends SqAbstractScale<"linear"> {
  tag = "linear" as const;

  static create(args: CommonScaleArgs = {}) {
    return new SqLinearScale({ type: "linear", ...args });
  }

  pdfYAdjustment(x: number, y: number) {
    return y;
  }
}

export class SqLogScale extends SqAbstractScale<"log"> {
  tag = "log" as const;

  static create(args: CommonScaleArgs = {}) {
    return new SqLogScale({ type: "log", ...args });
  }

  pdfYAdjustment(x: number, y: number) {
    return y * Math.abs(x);
  }
}
export class SqSymlogScale extends SqAbstractScale<"symlog"> {
  tag = "symlog" as const;

  static create(args: CommonScaleArgs & { base: number }) {
    return new SqSymlogScale({ type: "symlog", ...args });
  }

  get base() {
    return this._value.base;
  }

  pdfYAdjustment = (x: number, y: number) => {
    return y * Math.abs(x);
  };
}

export class SqPowerScale extends SqAbstractScale<"power"> {
  tag = "power" as const;

  static create(args: CommonScaleArgs & { exponent: number }) {
    return new SqPowerScale({ type: "power", ...args });
  }

  get exponent() {
    return this._value.exponent;
  }

  pdfYAdjustment = (x: number, y: number) => {
    return y * Math.pow(x, 1 - this._value.exponent);
  };
}

export type SqScale = SqLinearScale | SqLogScale | SqSymlogScale | SqPowerScale;
