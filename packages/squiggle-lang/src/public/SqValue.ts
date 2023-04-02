import { result } from "../utility/result.js";
import { Value } from "../value/index.js";
import { SqArray } from "./SqArray.js";
import { SqDistribution, wrapDistribution } from "./SqDistribution.js";
import { SqError } from "./SqError.js";
import { SqLambda } from "./SqLambda.js";
import { SqLambdaDeclaration } from "./SqLambdaDeclaration.js";
import { SqPlot, wrapPlot } from "./SqPlot.js";
import { SqRecord } from "./SqRecord.js";
import { SqValueLocation } from "./SqValueLocation.js";

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

export abstract class SqAbstractValue<T extends string, J> {
  abstract tag: T;

  constructor(
    protected _value: Extract<Value, { type: T }>,
    public location: SqValueLocation
  ) {}

  toString() {
    return this._value.toString();
  }

  abstract asJS(): J;
}

export class SqArrayValue extends SqAbstractValue<"Array", unknown[]> {
  tag = "Array" as const;

  get value() {
    return new SqArray(this._value.value, this.location);
  }

  asJS(): unknown[] {
    return this.value.getValues().map((value) => value.asJS());
  }
}

export class SqBoolValue extends SqAbstractValue<"Bool", boolean> {
  tag = "Bool" as const;

  get value(): boolean {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDateValue extends SqAbstractValue<"Date", Date> {
  tag = "Date" as const;

  get value(): Date {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqDeclarationValue extends SqAbstractValue<
  "Declaration",
  SqLambdaDeclaration
> {
  tag = "Declaration" as const;

  get value() {
    return new SqLambdaDeclaration(this._value.value, this.location);
  }

  asJS() {
    return this.value;
  }
}

export class SqDistributionValue extends SqAbstractValue<
  "Dist",
  SqDistribution
> {
  tag = "Dist" as const;

  get value() {
    return wrapDistribution(this._value.value);
  }

  asJS() {
    return this.value; // should we return BaseDist instead?
  }
}

export class SqLambdaValue extends SqAbstractValue<"Lambda", SqLambda> {
  tag = "Lambda" as const;

  get value() {
    return new SqLambda(this._value.value, this.location);
  }

  asJS() {
    return this.value; // SqLambda is nicer than internal Lambda, so we use that
  }
}

export class SqNumberValue extends SqAbstractValue<"Number", number> {
  tag = "Number" as const;

  get value(): number {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqRecordValue extends SqAbstractValue<
  "Record",
  Map<string, unknown>
> {
  tag = "Record" as const;

  get value() {
    return new SqRecord(this._value.value, this.location);
  }

  asJS(): Map<string, unknown> {
    return new Map(this.value.entries().map(([k, v]) => [k, v.asJS()])); // this is a native Map, not immutable Map
  }
}

export class SqStringValue extends SqAbstractValue<"String", string> {
  tag = "String" as const;

  get value(): string {
    return this._value.value;
  }

  asJS() {
    return this.value;
  }
}

export class SqTimeDurationValue extends SqAbstractValue<
  "TimeDuration",
  number
> {
  tag = "TimeDuration" as const;

  get value() {
    return this._value.value;
  }

  asJS() {
    return this._value.value;
  }
}

export class SqPlotValue extends SqAbstractValue<"Plot", SqPlot> {
  tag = "Plot" as const;

  get value() {
    return wrapPlot(this._value.value, this.location);
  }

  asJS() {
    return this.value;
  }
}

export class SqVoidValue extends SqAbstractValue<"Void", null> {
  tag = "Void" as const;

  get value() {
    return null;
  }

  asJS() {
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
