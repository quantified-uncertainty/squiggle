import { Lambda } from "../reducer/lambda/index.js";
import { TArray } from "./TArray.js";
import { TDateRange } from "./TDateRange.js";
import { TDict } from "./TDict.js";
import { TDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
import { TDist } from "./TDist.js";
import { TDistOrNumber } from "./TDistOrNumber.js";
import { TDomain } from "./TDomain.js";
import { TIntrinsic } from "./TIntrinsic.js";
import { TNumberRange } from "./TNumberRange.js";
import { TOr } from "./TOr.js";
import { TTagged } from "./TTagged.js";
import { TTuple } from "./TTuple.js";
import { TTypedLambda } from "./TTypedLambda.js";
import { tAny, TAny, Type } from "./Type.js";

// `T extends Type<infer U> ? U : never` is not enough for complex generic types.
// So we infer from `unpack()` method instead.
export type UnwrapType<T extends Type<any>> = Exclude<
  ReturnType<T["unpack"]>,
  undefined
>;

export function inferLambdaOutputType(
  lambda: Lambda,
  argTypes: Type[]
): Type | undefined {
  const possibleOutputTypes: Type<unknown>[] = [];
  for (const signature of lambda.signatures()) {
    const outputType = signature.inferOutputType(argTypes);
    if (outputType !== undefined) {
      possibleOutputTypes.push(outputType);
    }
  }
  if (!possibleOutputTypes.length) {
    return undefined;
  }
  if (possibleOutputTypes.length > 1) {
    // TODO - union
    return tAny();
  }
  return possibleOutputTypes[0];
}

// Check: type1 :> type2
export function isSupertypeOf(type1: Type, type2: Type): boolean {
  if (type1 instanceof TAny || type2 instanceof TAny) {
    return true;
  }

  if (type2 instanceof TTagged) {
    // T :> Tagged<T>; `f(x: T)` can be called with `Tagged<T>`
    return isSupertypeOf(type1, type2.itemType);
  }

  if (type1 instanceof TTagged) {
    // Tagged<T> :> T; `f(x: Tagged<T>)` can be called with `T`
    return isSupertypeOf(type1.itemType, type2);
  }

  if (type1 instanceof TIntrinsic) {
    if (type2 instanceof TIntrinsic) {
      return type1.valueType === type2.valueType;
    } else if (type2 instanceof TNumberRange) {
      return type1.valueType === "Number";
    } else if (type2 instanceof TDateRange) {
      return type1.valueType === "Date";
    } else if (type2 instanceof TTypedLambda) {
      return true;
    } else {
      return false;
    }
  }

  if (type1 instanceof TArray) {
    return (
      (type2 instanceof TArray &&
        isSupertypeOf(type1.itemType, type2.itemType)) ||
      (type2 instanceof TTuple &&
        type2.types.every((type) => isSupertypeOf(type1.itemType, type)))
    );
  }

  if (type1 instanceof TNumberRange) {
    return (
      type2 instanceof TNumberRange &&
      type1.min <= type2.min &&
      type1.max >= type2.max
    );
  }

  if (type1 instanceof TDateRange) {
    return (
      type2 instanceof TDateRange &&
      type1.min.toMs() <= type2.min.toMs() &&
      type1.max.toMs() >= type2.max.toMs()
    );
  }

  if (type1 instanceof TDict) {
    // TODO - support subtyping - `{ foo: string }` should be a supertype of `{ foo: string, bar: number }`
    if (!(type2 instanceof TDict)) {
      return false;
    }
    if (type1.kvs.length !== type2.kvs.length) {
      return false;
    }
    for (let i = 0; i < type1.kvs.length; i++) {
      if (!isSupertypeOf(type1.kvs[i].type, type2.kvs[i].type)) {
        return false;
      }
    }
    return true;
  }

  if (type1 instanceof TDist) {
    return (
      type2 instanceof TDist &&
      // either this is a generic dist or the dist classes match
      (!type1.distClass || type1.distClass === type2.distClass)
    );
  }

  if (type1 instanceof TDistOrNumber) {
    return (
      type2 instanceof TDistOrNumber ||
      type2 instanceof TDist ||
      (type2 instanceof TIntrinsic && type2.valueType === "Number")
    );
  }

  if (type1 instanceof TDomain && type2 instanceof TDomain) {
    return isSupertypeOf(type1.type, type2.type);
  }

  if (type1 instanceof TDictWithArbitraryKeys) {
    // DictWithArbitraryKeys(Number) :> DictWithArbitraryKeys(NumberRange(3, 5))
    if (
      type2 instanceof TDictWithArbitraryKeys &&
      isSupertypeOf(type1.itemType, type2.itemType)
    ) {
      return true;
    }

    // DictWithArbitraryKeys(Number) :> { foo: Number, bar: Number }
    if (type2 instanceof TDict) {
      for (let i = 0; i < type2.kvs.length; i++) {
        if (!isSupertypeOf(type1.itemType, type2.kvs[i].type)) {
          return false;
        }
      }
      return true;
    }
  }

  if (type1 instanceof TTuple) {
    if (type2 instanceof TTuple) {
      return (
        type1.types.length === type2.types.length &&
        type1.types.every((type, index) =>
          isSupertypeOf(type, type2.types[index])
        )
      );
    } else {
      return false;
    }
  }

  if (type1 instanceof TOr) {
    if (type2 instanceof TOr) {
      return (
        (isSupertypeOf(type1.type1, type2.type1) &&
          isSupertypeOf(type1.type2, type2.type2)) ||
        (isSupertypeOf(type1.type1, type2.type2) &&
          isSupertypeOf(type1.type2, type2.type1))
      );
    }
    return (
      isSupertypeOf(type1.type1, type2) || isSupertypeOf(type1.type2, type2)
    );
  }

  if (type1 instanceof TTypedLambda) {
    return (
      type2 instanceof TTypedLambda &&
      isSupertypeOf(type1.output, type2.output) &&
      type1.inputs.length === type2.inputs.length &&
      // inputs are contravariant; https://en.wikipedia.org/wiki/Subtyping#Function_types
      type2.inputs.every((input, index) =>
        isSupertypeOf(input.type, type1.inputs[index].type)
      )
    );
  }

  return false;
}

export function typesAreEqual(type1: Type, type2: Type) {
  return isSupertypeOf(type1, type2) && isSupertypeOf(type2, type1);
}
