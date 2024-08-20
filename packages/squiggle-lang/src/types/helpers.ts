import isEqual from "lodash/isEqual.js";

import { Lambda } from "../reducer/lambda/index.js";
import { Value } from "../value/index.js";
import { TArray } from "./TArray.js";
import { TDateRange } from "./TDateRange.js";
import { TDict } from "./TDict.js";
import { TDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
import { TDist } from "./TDist.js";
import { TDistOrNumber } from "./TDistOrNumber.js";
import { TDomain } from "./TDomain.js";
import { TIntrinsic, tNumber, tString } from "./TIntrinsic.js";
import { TNumberRange } from "./TNumberRange.js";
import { TOr } from "./TOr.js";
import { TTagged } from "./TTagged.js";
import { TTuple } from "./TTuple.js";
import { TTypedLambda } from "./TTypedLambda.js";
import { tUnion, TUnion } from "./TUnion.js";
import { tAny, TAny, Type } from "./Type.js";

// `T extends Type<infer U> ? U : never` is not enough for complex generic types.
// So we infer from `unpack()` method instead.
export type UnwrapType<T extends Type<any>> = Exclude<
  ReturnType<T["unpack"]>,
  undefined
>;

export function inferOutputTypeByMultipleSignatures(
  signatures: TTypedLambda[],
  argTypes: Type[]
): Type | undefined {
  const possibleOutputTypes: Type[] = [];
  for (const signature of signatures) {
    const outputType = signature.inferOutputType(argTypes);
    if (outputType !== undefined) {
      possibleOutputTypes.push(outputType);
    }
  }
  if (!possibleOutputTypes.length) {
    return undefined;
  }
  return makeUnionAndSimplify(possibleOutputTypes);
}

export function inferOutputTypeByLambda(
  lambda: Lambda,
  argTypes: Type[]
): Type | undefined {
  return inferOutputTypeByMultipleSignatures(lambda.signatures(), argTypes);
}

// Check whether the value of type `type2` can be used in place of a variable
// marked with `type1`, usually as a lambda parameter.
//
// This doesn't guarantee that this substitution is safe at runtime; we
// intentionally don't want to implement strict type checks, we just want to
// make sure that there's a chance that the code won't fail.
export function typeCanBeAssigned(type1: Type, type2: Type): boolean {
  if (type1 instanceof TAny || type2 instanceof TAny) {
    return true;
  }

  if (type2 instanceof TTagged) {
    // T :> Tagged<T>; `f(x: T)` can be called with `Tagged<T>`
    return typeCanBeAssigned(type1, type2.itemType);
  }

  if (type1 instanceof TTagged) {
    // Tagged<T> :> T; `f(x: Tagged<T>)` can be called with `T`
    return typeCanBeAssigned(type1.itemType, type2);
  }

  if (type1 instanceof TOr) {
    // number|string <= number is ok
    return (
      typeCanBeAssigned(type1.type1, type2) ||
      typeCanBeAssigned(type1.type2, type2)
    );
  }

  if (type2 instanceof TOr) {
    // number <= number|string is ok
    return (
      typeCanBeAssigned(type1, type2.type1) ||
      typeCanBeAssigned(type1, type2.type2)
    );
  }

  // TODO - this can be slow when we try to intersect two large unions
  if (type1 instanceof TUnion) {
    return type1.types.some((type) => typeCanBeAssigned(type, type2));
  }

  if (type2 instanceof TUnion) {
    return type2.types.some((type) => typeCanBeAssigned(type1, type));
  }

  if (type1 instanceof TIntrinsic) {
    if (type2 instanceof TIntrinsic) {
      return type1.valueType === type2.valueType;
    } else if (type2 instanceof TNumberRange) {
      return type1.valueType === "Number";
    } else if (type2 instanceof TDateRange) {
      return type1.valueType === "Date";
    } else if (type2 instanceof TTypedLambda) {
      // can assign any typed lambda to a lambda
      return true;
    } else {
      return false;
    }
  }

  if (type1 instanceof TArray) {
    return (
      (type2 instanceof TArray &&
        typeCanBeAssigned(type1.itemType, type2.itemType)) ||
      (type2 instanceof TTuple &&
        type2.types.every((type) => typeCanBeAssigned(type1.itemType, type)))
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
    if (!(type2 instanceof TDict)) {
      return false;
    }
    // check all keys and values
    for (const kv of type1.kvs) {
      const vtype2 = type2.valueType(kv.key);
      if (vtype2) {
        if (!typeCanBeAssigned(kv.type, vtype2)) {
          return false;
        }
      } else {
        if (!kv.optional) {
          return false;
        }
      }
    }
    return true;
  }

  if (type1 instanceof TDist) {
    return (
      type2 instanceof TDist &&
      // either this is a generic dist or the dist classes match
      (!type1.distClass ||
        !type2.distClass || // allow any dist class as a parameter to a specific dist class
        type1.distClass === type2.distClass)
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
    return typeCanBeAssigned(type1.type, type2.type);
  }

  if (type1 instanceof TDictWithArbitraryKeys) {
    if (
      type2 instanceof TDictWithArbitraryKeys &&
      typeCanBeAssigned(type1.itemType, type2.itemType)
    ) {
      return true;
    }

    // DictWithArbitraryKeys(Number) :> { foo: Number, bar: Number }
    if (type2 instanceof TDict) {
      for (let i = 0; i < type2.kvs.length; i++) {
        if (!typeCanBeAssigned(type1.itemType, type2.kvs[i].type)) {
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
          typeCanBeAssigned(type, type2.types[index])
        )
      );
    } else if (type2 instanceof TArray) {
      return type1.types.every((type, index) =>
        typeCanBeAssigned(type, type2.itemType)
      );
    } else {
      return false;
    }
  }

  if (type1 instanceof TTypedLambda) {
    if (type2 instanceof TIntrinsic && type2.valueType === "Lambda") {
      return true;
    }

    if (!(type2 instanceof TTypedLambda)) {
      return false;
    }

    if (!typeCanBeAssigned(type1.output, type2.output)) {
      // output types don't match
      return false;
    }

    if (
      type1.minInputs > type2.minInputs ||
      type1.maxInputs < type2.maxInputs
    ) {
      // input count doesn't match
      return false;
    }

    for (let i = 0; i < type1.minInputs; i++) {
      const inputType1 = type1.inputs.at(i)?.type;
      const inputType2 = type2.inputs.at(i)?.type;
      // inputs are contravariant; https://en.wikipedia.org/wiki/Subtyping#Function_types
      if (
        !inputType1 ||
        !inputType2 ||
        !typeCanBeAssigned(inputType2, inputType1)
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

export function makeUnionAndSimplify(types: Type[]): Type {
  const flatTypes: Type[] = [];
  const traverse = (type: Type) => {
    if (type instanceof TUnion) {
      type.types.forEach(traverse);
    } else {
      flatTypes.push(type);
    }
  };
  for (const type of types) traverse(type);

  const uniqueTypes: Type[] = [];
  // TODO - quadratic complexity; serialize and sort as strings, or keep the global deduplicated type registry?
  for (const type of flatTypes) {
    if (!uniqueTypes.some((uniqueType) => isEqual(type, uniqueType))) {
      uniqueTypes.push(type);
    }
  }
  if (uniqueTypes.length === 1) {
    return uniqueTypes[0];
  }

  // TODO - unwrap nested unions
  return tUnion(uniqueTypes);
}

export function typesAreEqual(type1: Type, type2: Type): boolean {
  return isEqual(type1, type2);
}

// This function is used for stdlib values, which are represented as `Value` instances.
// We need to convert values to their types for type checking.
export function getValueType(value: Value): Type {
  if (value.type === "Number") {
    return tNumber;
  }

  if (value.type === "String") {
    return tString;
  }

  if (value.type === "Lambda") {
    return makeUnionAndSimplify(value.value.signatures());
  } else {
    return tAny();
  }
}
