import * as RSSquiggleValue from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue.gen";
import { squiggleValueTag as Tag } from "../rescript/ForTS/ForTS_SquiggleValue/ForTS_SquiggleValue_tag";
import { Distribution, wrapDistribution } from "./Distribution";
import { Lambda } from "./Lambda";
import { LambdaDeclaration } from "./LambdaDeclaration";
import { NameSpace } from "./NameSpace";
import { Record } from "./Record";
import { SquiggleArray } from "./SquiggleArray";
import { Type } from "./Type";

export { Tag };

type T = RSSquiggleValue.squiggleValue;

export const wrapSquiggleValue = (value: T): SquiggleValue => {
  const tag = RSSquiggleValue.getTag(value);

  return new tagToClass[tag](value);
};

export abstract class AbstractSquiggleValue {
  abstract tag: Tag;
  _value: T;

  constructor(value: T) {
    this._value = value;
  }
}

const valueMethod = <IR>(
  _this: AbstractSquiggleValue,
  rsMethod: (v: T) => IR | null | undefined
) => {
  const value = rsMethod(_this._value);
  if (!value) throw new Error("Internal casting error");
  return value;
};

export class ArrayValue extends AbstractSquiggleValue {
  tag = Tag.SvtArray as const;

  get value() {
    return new SquiggleArray(valueMethod(this, RSSquiggleValue.getArray));
  }
}

export class ArrayStringValue extends AbstractSquiggleValue {
  tag = Tag.SvtArrayString as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getArrayString);
  }
}

export class BoolValue extends AbstractSquiggleValue {
  tag = Tag.SvtBool as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getBool);
  }
}

export class CallValue extends AbstractSquiggleValue {
  tag = Tag.SvtCall as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getCall);
  }
}

export class DateValue extends AbstractSquiggleValue {
  tag = Tag.SvtDate as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getDate);
  }
}

export class DeclarationValue extends AbstractSquiggleValue {
  tag = Tag.SvtDeclaration as const;

  get value() {
    return new LambdaDeclaration(
      valueMethod(this, RSSquiggleValue.getDeclaration)
    );
  }
}

export class DistributionValue extends AbstractSquiggleValue {
  tag = Tag.SvtDistribution as const;

  get value() {
    return wrapDistribution(valueMethod(this, RSSquiggleValue.getDistribution));
  }
}

export class LambdaValue extends AbstractSquiggleValue {
  tag = Tag.SvtLambda as const;

  get value() {
    return new Lambda(valueMethod(this, RSSquiggleValue.getLambda));
  }
}

export class ModuleValue extends AbstractSquiggleValue {
  tag = Tag.SvtModule as const;

  get value() {
    return new NameSpace(valueMethod(this, RSSquiggleValue.getModule));
  }
}

export class NumberValue extends AbstractSquiggleValue {
  tag = Tag.SvtNumber as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getNumber);
  }
}

export class RecordValue extends AbstractSquiggleValue {
  tag = Tag.SvtRecord as const;

  get value() {
    return new Record(valueMethod(this, RSSquiggleValue.getRecord));
  }
}

export class StringValue extends AbstractSquiggleValue {
  tag = Tag.SvtString as const;

  get value(): string {
    return valueMethod(this, RSSquiggleValue.getString);
  }
}

export class SymbolValue extends AbstractSquiggleValue {
  tag = Tag.SvtSymbol as const;

  get value(): string {
    return valueMethod(this, RSSquiggleValue.getSymbol);
  }
}

export class TimeDurationValue extends AbstractSquiggleValue {
  tag = Tag.SvtTimeDuration as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getTimeDuration);
  }
}

export class TypeValue extends AbstractSquiggleValue {
  tag = Tag.SvtType as const;

  get value() {
    return new Type(valueMethod(this, RSSquiggleValue.getType));
  }
}

export class TypeIdentifierValue extends AbstractSquiggleValue {
  tag = Tag.SvtTypeIdentifier as const;

  get value() {
    return valueMethod(this, RSSquiggleValue.getTypeIdentifier);
  }
}

export class VoidValue extends AbstractSquiggleValue {
  tag = Tag.SvtVoid as const;
}

const tagToClass = {
  [Tag.SvtArray]: ArrayValue,
  [Tag.SvtArrayString]: ArrayStringValue,
  [Tag.SvtBool]: BoolValue,
  [Tag.SvtCall]: CallValue,
  [Tag.SvtDate]: DateValue,
  [Tag.SvtDeclaration]: DeclarationValue,
  [Tag.SvtDistribution]: DistributionValue,
  [Tag.SvtLambda]: LambdaValue,
  [Tag.SvtModule]: ModuleValue,
  [Tag.SvtNumber]: NumberValue,
  [Tag.SvtRecord]: RecordValue,
  [Tag.SvtString]: StringValue,
  [Tag.SvtSymbol]: SymbolValue,
  [Tag.SvtTimeDuration]: TimeDurationValue,
  [Tag.SvtType]: TypeValue,
  [Tag.SvtTypeIdentifier]: TypeIdentifierValue,
  [Tag.SvtVoid]: VoidValue,
} as const;

// FIXME
// type AnySquiggleValue = typeof tagToClass[keyof typeof tagToClass];
export type SquiggleValue =
  | ArrayValue
  | ArrayStringValue
  | BoolValue
  | CallValue
  | DateValue
  | DeclarationValue
  | DistributionValue
  | LambdaValue
  | ModuleValue
  | NumberValue
  | RecordValue
  | StringValue
  | SymbolValue
  | TimeDurationValue
  | TypeValue
  | TypeIdentifierValue
  | VoidValue;
