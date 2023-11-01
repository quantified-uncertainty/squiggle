import { BaseDist } from "../../dist/BaseDist.js";
import { Lambda } from "../../reducer/lambda.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
import {
  Scale,
  Value,
  vArray,
  vBool,
  vDate,
  vDist,
  vLambda,
  vNumber,
  vDict,
  vScale,
  vString,
  vTimeDuration,
  vInput,
  Input,
} from "../../value/index.js";

/*
FRType is a function that unpacks a Value.
Each function identifies the specific type and can be used in a function definition signature.
*/
export type FRType<T> = {
  unpack: (v: Value) => T | undefined;
  pack: (v: T) => Value; // used in makeSquiggleDefinition
  getName: () => string;
};

export const frNumber: FRType<number> = {
  unpack: (v: Value) => (v.type === "Number" ? v.value : undefined),
  pack: (v) => vNumber(v),
  getName: () => "number",
};
export const frString: FRType<string> = {
  unpack: (v: Value) => (v.type === "String" ? v.value : undefined),
  pack: (v) => vString(v),
  getName: () => "string",
};
export const frBool: FRType<boolean> = {
  unpack: (v: Value) => (v.type === "Bool" ? v.value : undefined),
  pack: (v) => vBool(v),
  getName: () => "bool",
};
export const frDate: FRType<Date> = {
  unpack: (v) => (v.type === "Date" ? v.value : undefined),
  pack: (v) => vDate(v),
  getName: () => "date",
};
export const frTimeDuration: FRType<number> = {
  unpack: (v) => (v.type === "TimeDuration" ? v.value : undefined),
  pack: (v) => vTimeDuration(v),
  getName: () => "duration",
};
export const frDistOrNumber: FRType<BaseDist | number> = {
  unpack: (v) =>
    v.type === "Dist" ? v.value : v.type === "Number" ? v.value : undefined,
  pack: (v) => (typeof v === "number" ? vNumber(v) : vDist(v)),
  getName: () => "distribution|number",
};
export const frNumberOrString: FRType<string | number> = {
  unpack: (v) =>
    v.type === "String" ? v.value : v.type === "Number" ? v.value : undefined,
  pack: (v) => (typeof v === "number" ? vNumber(v) : vString(v)),
  getName: () => "number|string",
};
export const frDist: FRType<BaseDist> = {
  unpack: (v) => (v.type === "Dist" ? v.value : undefined),
  pack: (v) => vDist(v),
  getName: () => "distribution",
};
export const frLambda: FRType<Lambda> = {
  unpack: (v) => (v.type === "Lambda" ? v.value : undefined),
  pack: (v) => vLambda(v),
  getName: () => "lambda",
};
export const frLambdaN = (paramLength: number): FRType<Lambda> => {
  return {
    unpack: (v: Value) => {
      return v.type === "Lambda" &&
        v.value.parameterCounts().includes(paramLength)
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
    getName: () => `lambda(${paramLength})`,
  };
};
export const frLambdaNand = (paramLengths: number[]): FRType<Lambda> => {
  return {
    unpack: (v: Value) => {
      const counts = v.type === "Lambda" && v.value.parameterCounts();
      return counts && paramLengths.every((p) => counts.includes(p))
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
    getName: () => `lambda(${paramLengths.join(",")})`,
  };
};
export const frScale: FRType<Scale> = {
  unpack: (v) => (v.type === "Scale" ? v.value : undefined),
  pack: (v) => vScale(v),
  getName: () => "scale",
};
export const frInput: FRType<Input> = {
  unpack: (v) => (v.type === "Input" ? v.value : undefined),
  pack: (v) => vInput(v),
  getName: () => "input",
};

export const frArray = <T>(itemType: FRType<T>): FRType<T[]> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (itemType.getName() === "any") {
        // special case, performance optimization
        return v.value as T[];
      }

      const unpackedArray: T[] = [];
      for (const item of v.value) {
        const unpackedItem = itemType.unpack(item);
        if (unpackedItem === undefined) {
          return undefined;
        }
        unpackedArray.push(unpackedItem);
      }
      return unpackedArray;
    },
    pack: (v) => vArray(v.map(itemType.pack)),
    getName: () => `list(${itemType.getName()})`,
  };
};

export function frTuple<T1, T2>(
  type1: FRType<T1>,
  type2: FRType<T2>
): FRType<[T1, T2]>;

export function frTuple<T1, T2, T3>(
  type1: FRType<T1>,
  type2: FRType<T2>,
  type3: FRType<T3>
): FRType<[T1, T2, T3]>;

export function frTuple<T1, T2, T3, T4>(
  type1: FRType<T1>,
  type2: FRType<T2>,
  type3: FRType<T3>,
  type4: FRType<T4>
): FRType<[T1, T2, T3, T4]>;

export function frTuple<T1, T2, T3, T4, T5>(
  type1: FRType<T1>,
  type2: FRType<T2>,
  type3: FRType<T3>,
  type4: FRType<T4>,
  type5: FRType<T5>
): FRType<[T1, T2, T3, T4, T5]>;

export function frTuple(...types: FRType<unknown>[]): FRType<any> {
  const numTypes = types.length;

  return {
    unpack: (v: Value) => {
      if (v.type !== "Array" || v.value.length !== numTypes) {
        return undefined;
      }

      const items = types.map((type, index) => type.unpack(v.value[index]));

      if (items.some((item) => item === undefined)) {
        return undefined;
      }

      return items;
    },
    pack: (values: unknown[]) => {
      return vArray(values.map((val, index) => types[index].pack(val)));
    },
    getName: () => `tuple(${types.map((type) => type.getName()).join(", ")})`,
  };
}

export const frDictWithArbitraryKeys = <T>(
  itemType: FRType<T>
): FRType<ImmutableMap<string, T>> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Dict") {
        return undefined;
      }
      // TODO - skip loop and copying if itemType is `any`
      let unpackedMap: ImmutableMap<string, T> = ImmutableMap();
      for (const [key, value] of v.value.entries()) {
        const unpackedItem = itemType.unpack(value);
        if (unpackedItem === undefined) {
          return undefined;
        }
        unpackedMap = unpackedMap.set(key, unpackedItem);
      }
      return unpackedMap;
    },
    pack: (v) =>
      vDict(
        ImmutableMap([...v.entries()].map(([k, v]) => [k, itemType.pack(v)]))
      ),
    getName: () => `dict(${itemType.getName()})`,
  };
};

export const frAny: FRType<Value> = {
  unpack: (v) => v,
  pack: (v) => v,
  getName: () => "any",
};

// We currently support dicts with up to 5 pairs.
// The limit could be increased with the same pattern, but there might be a better solution for this.
export function frDict<K1 extends string, T1>(
  kv1: [K1, FRType<T1>]
): FRType<{ [k in K1]: T1 }>;
export function frDict<K1 extends string, T1, K2 extends string, T2>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 }>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 }>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
  K4 extends string,
  T4,
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & { [k in K4]: T4 }
>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
  K4 extends string,
  T4,
  K5 extends string,
  T5,
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>],
  kv5: [K5, FRType<T5>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & {
    [k in K4]: T4;
  } & { [k in K5]: T5 }
>;
export function frDict<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3,
  K4 extends string,
  T4,
  K5 extends string,
  T5,
  K6 extends string,
  T6,
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>],
  kv5: [K5, FRType<T5>],
  kv6: [K6, FRType<T6>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & {
    [k in K4]: T4;
  } & { [k in K5]: T5 } & { [k in K6]: T6 }
>;

export function frDict<T extends object>(
  ...allKvs: [string, FRType<unknown>][]
): FRType<T> {
  return {
    unpack: (v: Value) => {
      // extra keys are allowed

      if (v.type !== "Dict") {
        return undefined;
      }
      const r = v.value;

      const result: { [k: string]: any } = {};

      for (const [key, valueShape] of allKvs) {
        const subvalue = r.get(key);
        if (subvalue === undefined) {
          if ("isOptional" in valueShape) {
            // that's ok!
            continue;
          }
          return undefined;
        }
        const unpackedSubvalue = valueShape.unpack(subvalue);
        if (unpackedSubvalue === undefined) {
          return undefined;
        }
        result[key] = unpackedSubvalue;
      }
      return result as any; // that's ok, overload signatures guarantee type safety
    },
    pack: (v) =>
      vDict(
        ImmutableMap(
          allKvs
            .filter(
              ([key, valueShape]) =>
                !("isOptional" in valueShape) || (v as any)[key] !== null
            )
            .map(([key, valueShape]) => [key, valueShape.pack((v as any)[key])])
        )
      ),
    getName: () =>
      "{" +
      allKvs
        .map(([name, frType]) => `${name}: ${frType.getName()}`)
        .join(", ") +
      "}",
  };
}

// Optionals are implemented for the sake of frDict, which check for them explicitly.
// Don't try to use them in other contexts.
export const frOptional = <T>(
  itemType: FRType<T>
): FRType<T | null> & { isOptional: boolean } => {
  return {
    unpack: (v: Value) => {
      return itemType.unpack(v);
    },
    pack: (v) => {
      if (v === null) {
        // shouldn't happen if frDict implementation is correct and frOptional is used correctly.
        throw new Error("Unable to pack null value");
      }
      return itemType.pack(v);
    },
    getName: () => `optional(${itemType.getName()})`,
    isOptional: true,
  };
};
