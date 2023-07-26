import {
  CommonScaleArgs,
  Scale,
  vScale,
  SCALE_SYMLOG_DEFAULT_CONSTANT,
  SCALE_POWER_DEFAULT_CONSTANT,
} from "../../value/index.js";

export const wrapScale = (value: Scale): SqScale => {
  switch (value.type) {
    case "linear":
      return SqLinearScale.create(value);
    case "log":
      return SqLogScale.create(value);
    case "symlog":
      return SqSymlogScale.create(value);
    case "power":
      return SqPowerScale.create(value);
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
}

export class SqLogScale extends SqAbstractScale<"log"> {
  tag = "log" as const;

  static create(args: CommonScaleArgs = {}) {
    return new SqLogScale({ type: "log", ...args });
  }
}

export class SqSymlogScale extends SqAbstractScale<"symlog"> {
  tag = "symlog" as const;
  static defaultConstant = SCALE_SYMLOG_DEFAULT_CONSTANT;

  static create(args: CommonScaleArgs & { constant?: number }) {
    return new SqSymlogScale({
      type: "symlog",
      ...args,
      constant: args.constant || this.defaultConstant,
    });
  }

  get constant() {
    return this._value.constant || SCALE_SYMLOG_DEFAULT_CONSTANT;
  }
}

export class SqPowerScale extends SqAbstractScale<"power"> {
  tag = "power" as const;
  static defaultExponent = SCALE_POWER_DEFAULT_CONSTANT;

  static create(args: CommonScaleArgs & { exponent?: number }) {
    return new SqPowerScale({
      type: "power",
      ...args,
      exponent: args.exponent || this.defaultExponent,
    });
  }

  get exponent() {
    return this._value.exponent || SCALE_POWER_DEFAULT_CONSTANT;
  }
}

export type SqScale = SqLinearScale | SqLogScale | SqSymlogScale | SqPowerScale;
