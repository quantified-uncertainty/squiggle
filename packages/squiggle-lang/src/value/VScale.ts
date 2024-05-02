import { BaseValue } from "./BaseValue.js";

export type ScaleMethod =
  | {
      type: "linear";
    }
  | {
      type: "date";
    }
  | {
      type: "log";
    }
  | {
      type: "symlog";
      constant?: number;
    }
  | {
      type: "power";
      exponent?: number;
    };

export function methodWithDefaultParams(shift: ScaleMethod) {
  switch (shift.type) {
    case "symlog":
      return {
        ...shift,
        constant: shift.constant ?? SCALE_SYMLOG_DEFAULT_CONSTANT,
      };
    case "power":
      return {
        ...shift,
        exponent: shift.exponent ?? SCALE_POWER_DEFAULT_CONSTANT,
      };
    default:
      return shift;
  }
}

export type Scale = {
  method?: ScaleMethod;
  min?: number;
  max?: number;
  tickFormat?: string;
  title?: string;
};

function methodIsEqual(valueA: ScaleMethod, valueB: ScaleMethod) {
  if (valueA.type !== valueB.type) {
    return false;
  }
  switch (valueA.type) {
    case "symlog":
      return (
        (valueA as { constant?: number }).constant ===
        (valueB as { constant?: number }).constant
      );
    case "power":
      return (
        (valueA as { exponent?: number }).exponent ===
        (valueB as { exponent?: number }).exponent
      );
    default:
      return true;
  }
}

function scaleIsEqual(valueA: Scale, valueB: Scale) {
  if (
    valueA.method?.type !== valueB.method?.type ||
    valueA.min !== valueB.min ||
    valueA.max !== valueB.max ||
    valueA.tickFormat !== valueB.tickFormat
  ) {
    return false;
  }
  if (valueA.method && valueB.method) {
    return methodIsEqual(valueA.method, valueB.method);
  }
  return true;
}

export const SCALE_SYMLOG_DEFAULT_CONSTANT = 0.0001;
export const SCALE_POWER_DEFAULT_CONSTANT = 0.1;

export class VScale extends BaseValue<"Scale", Scale> {
  readonly type = "Scale";

  constructor(public value: Scale) {
    super();
  }

  valueToString() {
    switch (this.value.method?.type) {
      case "linear":
        return "Linear scale"; // TODO - mix in min/max if specified
      case "log":
        return "Logarithmic scale";
      case "symlog":
        return `Symlog scale ({constant: ${
          this.value.method.constant || SCALE_SYMLOG_DEFAULT_CONSTANT
        }})`;
      case "power":
        return `Power scale ({exponent: ${
          this.value.method.exponent || SCALE_POWER_DEFAULT_CONSTANT
        }})`;
      case "date":
        return "Date scale";
      default:
        return "Unspecified scale";
    }
  }

  isEqual(other: VScale) {
    return scaleIsEqual(this.value, other.value);
  }

  override serializePayload(): Scale {
    return this.value;
  }

  static deserialize(payload: Scale): VScale {
    return new VScale(payload);
  }
}

export const vScale = (scale: Scale) => new VScale(scale);
