import * as RSValue from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue.gen";
import { squiggleValueTag as Tag } from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_tag";
import { wrapDistribution } from "./SqDistribution";
import { SqLambda } from "./SqLambda";
import { SqLambdaDeclaration } from "./SqLambdaDeclaration";
import { SqModule } from "./SqModule";
import { SqRecord } from "./SqRecord";
import { SqArray } from "./SqArray";
import { SqType } from "./SqType";
import { SqProject } from "./SqProject";
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

  protected valueMethod = <IR>(rsMethod: (v: T) => IR | null | undefined) => {
    const value = rsMethod(this._value);
    if (value === undefined || value === null) {
      throw new Error("Internal casting error");
    }
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

export class SqArrayStringValue extends SqAbstractValue {
  tag = Tag.ArrayString as const;

  get value() {
    return this.valueMethod(RSValue.getArrayString);
  }
}

export class SqBoolValue extends SqAbstractValue {
  tag = Tag.Bool as const;

  get value() {
    return this.valueMethod(RSValue.getBool);
  }
}

export class SqCallValue extends SqAbstractValue {
  tag = Tag.Call as const;

  get value() {
    return this.valueMethod(RSValue.getCall);
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

export class SqModuleValue extends SqAbstractValue {
  tag = Tag.Module as const;

  get value() {
    return new SqModule(this.valueMethod(RSValue.getModule), this.location);
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

export class SqSymbolValue extends SqAbstractValue {
  tag = Tag.Symbol as const;

  get value(): string {
    return this.valueMethod(RSValue.getSymbol);
  }
}

export class SqTimeDurationValue extends SqAbstractValue {
  tag = Tag.TimeDuration as const;

  get value() {
    return this.valueMethod(RSValue.getTimeDuration);
  }
}

export class SqTypeValue extends SqAbstractValue {
  tag = Tag.Type as const;

  get value() {
    return new SqType(this.valueMethod(RSValue.getType));
  }
}

export class SqTypeIdentifierValue extends SqAbstractValue {
  tag = Tag.TypeIdentifier as const;

  get value() {
    return this.valueMethod(RSValue.getTypeIdentifier);
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
  [Tag.ArrayString]: SqArrayStringValue,
  [Tag.Bool]: SqBoolValue,
  [Tag.Call]: SqCallValue,
  [Tag.Date]: SqDateValue,
  [Tag.Declaration]: SqDeclarationValue,
  [Tag.Distribution]: SqDistributionValue,
  [Tag.Lambda]: SqLambdaValue,
  [Tag.Module]: SqModuleValue,
  [Tag.Number]: SqNumberValue,
  [Tag.Record]: SqRecordValue,
  [Tag.String]: SqStringValue,
  [Tag.Symbol]: SqSymbolValue,
  [Tag.TimeDuration]: SqTimeDurationValue,
  [Tag.Type]: SqTypeValue,
  [Tag.TypeIdentifier]: SqTypeIdentifierValue,
  [Tag.Void]: SqVoidValue,
} as const;

// FIXME
// type SqValue = typeof tagToClass[keyof typeof tagToClass];
export type SqValue =
  | SqArrayValue
  | SqArrayStringValue
  | SqBoolValue
  | SqCallValue
  | SqDateValue
  | SqDeclarationValue
  | SqDistributionValue
  | SqLambdaValue
  | SqModuleValue
  | SqNumberValue
  | SqRecordValue
  | SqStringValue
  | SqSymbolValue
  | SqTimeDurationValue
  | SqTypeValue
  | SqTypeIdentifierValue
  | SqVoidValue;
