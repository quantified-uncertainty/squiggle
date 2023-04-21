import { Scale, vScale } from "../value/index.js";
import { SqScaleValue } from "./SqValue.js";
import { SqValueLocation } from "./SqValueLocation.js";

export const wrapScale = (value: Scale): SqScale => {
  switch (value.type) {
    case "linear":
      return new SqLinearScale(value);
    case "log":
      return new SqLogScale(value);
    case "symlog":
      return new SqSymlogScale(value);
  }
};

abstract class SqAbstractScale<T extends Scale["type"]> {
  abstract tag: T;

  constructor(protected _value: Extract<Scale, { type: T }>) {}

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

  static create({ min, max }: { min: number; max: number }) {
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

export type SqScale = SqLinearScale | SqLogScale | SqSymlogScale;
