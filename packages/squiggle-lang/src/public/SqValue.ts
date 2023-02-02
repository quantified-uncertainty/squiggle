import { result } from "../utility/result";
import { wrapDistribution } from "./SqDistribution";
import { SqLambda } from "./SqLambda";
import { SqLambdaDeclaration } from "./SqLambdaDeclaration";
import { SqRecord } from "./SqRecord";
import { SqPlot } from "./SqPlot";
import { SqArray } from "./SqArray";
import { SqValueLocation } from "./SqValueLocation";
import { SqError } from "./SqError";
import { Value } from "../value";

export const wrapValue = (value: Value, location: SqValueLocation): SqValue => {
  const tag = value.type;

  switch (value.type) {
    case "Array":
      return new SqArrayValue(value, location);
    case "Bool":
      return new SqBoolValue(value, location);
    case "Date":
      return new SqDateValue(value, location);
    case "Declaration":
      return new SqDeclarationValue(value, location);
    case "Dist":
      return new SqDistributionValue(value, location);
    case "Lambda":
      return new SqLambdaValue(value, location);
    case "Number":
      return new SqNumberValue(value, location);
    case "Record":
      return new SqRecordValue(value, location);
    case "String":
      return new SqStringValue(value, location);
    case "Plot":
      return new SqPlotValue(value, location);
    case "TimeDuration":
      return new SqTimeDurationValue(value, location);
    case "Void":
      return new SqVoidValue(value, location);
    default:
      throw new Error(`Unknown value ${JSON.stringify(value)}`);
  }
};

export abstract class SqAbstractValue<T> {
  abstract tag: T;

  constructor(
    protected _value: Extract<Value, { type: T }>,
    public location: SqValueLocation
  ) {}

  toString() {
    return this._value.toString();
  }
}

export class SqArrayValue extends SqAbstractValue<"Array"> {
  tag = "Array" as const;

  get value() {
    return new SqArray(this._value.value, this.location);
  }
}

export class SqBoolValue extends SqAbstractValue<"Bool"> {
  tag = "Bool" as const;

  get value(): boolean {
    return this._value.value;
  }
}

export class SqDateValue extends SqAbstractValue<"Date"> {
  tag = "Date" as const;

  get value(): Date {
    return this._value.value;
  }
}

export class SqDeclarationValue extends SqAbstractValue<"Declaration"> {
  tag = "Declaration" as const;

  get value() {
    return new SqLambdaDeclaration(this._value.value);
  }
}

export class SqDistributionValue extends SqAbstractValue<"Dist"> {
  tag = "Dist" as const;

  get value() {
    return wrapDistribution(this._value.value);
  }
}

export class SqLambdaValue extends SqAbstractValue<"Lambda"> {
  tag = "Lambda" as const;

  get value() {
    return new SqLambda(this._value.value, this.location);
  }
}

export class SqNumberValue extends SqAbstractValue<"Number"> {
  tag = "Number" as const;

  get value(): number {
    return this._value.value;
  }
}

export class SqRecordValue extends SqAbstractValue<"Record"> {
  tag = "Record" as const;

  get value() {
    return new SqRecord(this._value.value, this.location);
  }
}

export class SqStringValue extends SqAbstractValue<"String"> {
  tag = "String" as const;

  get value(): string {
    return this._value.value;
  }
}

export class SqTimeDurationValue extends SqAbstractValue<"TimeDuration"> {
  tag = "TimeDuration" as const;

  get value() {
    return this._value.value;
  }
}

export class SqPlotValue extends SqAbstractValue<"Plot"> {
  tag = "Plot" as const;

  get value() {
    return new SqPlot(this._value.value, this.location);
  }
}

export class SqVoidValue extends SqAbstractValue<"Void"> {
  tag = "Void" as const;

  get value() {
    return null;
  }
}

// FIXME
// type SqValue = typeof tagToClass[keyof typeof tagToClass];
export type SqValue =
  | SqArrayValue
  | SqBoolValue
  | SqDateValue
  | SqDeclarationValue
  | SqDistributionValue
  | SqLambdaValue
  | SqNumberValue
  | SqRecordValue
  | SqStringValue
  | SqTimeDurationValue
  | SqPlotValue
  | SqVoidValue;

export const toStringResult = (result: result<SqValue, SqError>) => {
  return `${result.ok ? "Ok" : "Error"}(${result.value.toString()})`;
};
