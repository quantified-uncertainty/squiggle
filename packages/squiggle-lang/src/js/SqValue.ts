import * as RSValue from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue.gen";
import { squiggleValueTag as Tag } from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_tag";
import { wrapDistribution } from "./SqDistribution";
import { SqLambda } from "./SqLambda";
import { SqLambdaDeclaration } from "./SqLambdaDeclaration";
import { SqRecord } from "./SqRecord";
import { SqArray } from "./SqArray";
import { SqValueLocation } from "./SqValueLocation";

export { Tag as SqValueTag };

type T = RSValue.squiggleValue;

export const wrapValue = (value: T, location: SqValueLocation): SqValue => {
  const tag = RSValue.getTag(value);

  return new tagToClass[tag](value, location);
};

export abstract class SqAbstractValue {
  abstract tag: Tag;

  constructor(private _value: T, public location: SqValueLocation) {}

  protected valueMethod = <IR>(rsMethod: (v: T) => IR) => {
    const value = rsMethod(this._value);
    return value;
  };

  toString() {
    return RSValue.toString(this._value);
  }
}

export class SqArrayValue extends SqAbstractValue {
  tag = Tag.Array as const;

  get value() {
    return new SqArray(this.valueMethod(RSValue.getArray), this.location);
  }
}

export class SqBoolValue extends SqAbstractValue {
  tag = Tag.Bool as const;

  get value() {
    return this.valueMethod(RSValue.getBool);
  }
}

export class SqDateValue extends SqAbstractValue {
  tag = Tag.Date as const;

  get value() {
    return this.valueMethod(RSValue.getDate);
  }
}

export class SqDeclarationValue extends SqAbstractValue {
  tag = Tag.Declaration as const;

  get value() {
    return new SqLambdaDeclaration(this.valueMethod(RSValue.getDeclaration));
  }
}

export class SqDistributionValue extends SqAbstractValue {
  tag = Tag.Distribution as const;

  get value() {
    return wrapDistribution(this.valueMethod(RSValue.getDistribution));
  }
}

export class SqLambdaValue extends SqAbstractValue {
  tag = Tag.Lambda as const;

  get value() {
    return new SqLambda(this.valueMethod(RSValue.getLambda), this.location);
  }
}

export class SqNumberValue extends SqAbstractValue {
  tag = Tag.Number as const;

  get value() {
    return this.valueMethod(RSValue.getNumber);
  }
}

export class SqRecordValue extends SqAbstractValue {
  tag = Tag.Record as const;

  get value() {
    return new SqRecord(this.valueMethod(RSValue.getRecord), this.location);
  }
}

export class SqStringValue extends SqAbstractValue {
  tag = Tag.String as const;

  get value(): string {
    return this.valueMethod(RSValue.getString);
  }
}

export class SqTimeDurationValue extends SqAbstractValue {
  tag = Tag.TimeDuration as const;

  get value() {
    return this.valueMethod(RSValue.getTimeDuration);
  }
}

export class SqVoidValue extends SqAbstractValue {
  tag = Tag.Void as const;

  get value() {
    return null;
  }
}

const tagToClass = {
  [Tag.Array]: SqArrayValue,
  [Tag.Bool]: SqBoolValue,
  [Tag.Date]: SqDateValue,
  [Tag.Declaration]: SqDeclarationValue,
  [Tag.Distribution]: SqDistributionValue,
  [Tag.Lambda]: SqLambdaValue,
  [Tag.Number]: SqNumberValue,
  [Tag.Record]: SqRecordValue,
  [Tag.String]: SqStringValue,
  [Tag.TimeDuration]: SqTimeDurationValue,
  [Tag.Void]: SqVoidValue,
} as const;

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
  | SqVoidValue;
