import { Scale, vScale } from "../value/index.js";

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
}

export class SqLinearScale extends SqAbstractScale<"linear"> {
  tag = "linear" as const;

  static create({ min, max }: { min?: number; max?: number } = {}) {
    return new SqLinearScale({ type: "linear", min, max });
  }

  get min() {
    return this._value.min;
  }
  get max() {
    return this._value.max;
  }
}

export class SqLogScale extends SqAbstractScale<"log"> {
  tag = "log" as const;

  static create({ min, max }: { min?: number; max?: number } = {}) {
    return new SqLogScale({ type: "log", min, max });
  }

  get min() {
    return this._value.min;
  }
  get max() {
    return this._value.max;
  }
}

export class SqSymlogScale extends SqAbstractScale<"symlog"> {
  tag = "symlog" as const;

  static create({ min, max }: { min: number; max: number }) {
    return new SqSymlogScale({ type: "symlog", min, max });
  }

  get min() {
    return this._value.min;
  }
  get max() {
    return this._value.max;
  }
}

export class SqPowerScale extends SqAbstractScale<"power"> {
  tag = "power" as const;

  static create(args: { min?: number; max?: number; exponent: number }) {
    return new SqPowerScale({ type: "power", ...args });
  }

  get min() {
    return this._value.min;
  }
  get max() {
    return this._value.max;
  }
  get exponent() {
    return this._value.exponent;
  }
}

export type SqScale = SqLinearScale | SqLogScale | SqSymlogScale | SqPowerScale;
