import { BaseDist } from "../../dist/BaseDist";
import { Lambda } from "../../reducer/lambda";
import { ImmutableMap } from "../../utility/immutableMap";
import { Value } from "../../value";

/*
FRType is a function that unpacks a Value.
Each function identifies the specific type and can be used in a function definition signature.
*/
export type FRType<T> = {
  unpack: (v: Value) => T | undefined;
  getName: () => string;
};

export const frNumber: FRType<number> = {
  unpack: (v: Value) => (v.type === "Number" ? v.value : undefined),
  getName: () => "number",
};
export const frString: FRType<string> = {
  unpack: (v: Value) => (v.type === "String" ? v.value : undefined),
  getName: () => "string",
};
export const frBool: FRType<boolean> = {
  unpack: (v: Value) => (v.type === "Bool" ? v.value : undefined),
  getName: () => "bool",
};
export const frDate: FRType<Date> = {
  unpack: (v) => (v.type === "Date" ? v.value : undefined),
  getName: () => "date",
};
export const frTimeDuration: FRType<number> = {
  unpack: (v) => (v.type === "TimeDuration" ? v.value : undefined),
  getName: () => "duration",
};
export const frDistOrNumber: FRType<BaseDist | number> = {
  unpack: (v) =>
    v.type === "Dist" ? v.value : v.type === "Number" ? v.value : undefined,
  getName: () => "distribution|number",
};
export const frDist: FRType<BaseDist> = {
  unpack: (v) => (v.type === "Dist" ? v.value : undefined),
  getName: () => "distribution",
};
export const frLambda: FRType<Lambda> = {
  unpack: (v) => (v.type === "Lambda" ? v.value : undefined),
  getName: () => "lambda",
};

export const frArray = <T>(itemType: FRType<T>): FRType<T[]> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      const unpackedArray: T[] = [];
      for (const item of v.value) {
        // TODO - skip checks if itemType is `any`
        const unpackedItem = itemType.unpack(item);
        if (unpackedItem === undefined) {
          return undefined;
        }
        unpackedArray.push(unpackedItem);
      }
      return unpackedArray;
    },
    getName: () => `list(${itemType.getName()})`,
  };
};

export const frTuple2 = <T1, T2>(
  type1: FRType<T1>,
  type2: FRType<T2>
): FRType<[T1, T2]> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (v.value.length !== 2) {
        return undefined;
      }
      const item1 = type1.unpack(v.value[0]);
      const item2 = type2.unpack(v.value[1]);
      if (item1 === undefined || item2 === undefined) {
        return undefined;
      }
      return [item1, item2];
    },
    getName: () => `tuple(${type1.getName()}, ${type2.getName()})`,
  };
};

export const frDict = <T>(
  itemType: FRType<T>
): FRType<ImmutableMap<string, T>> => {
  return {
    unpack: (v: Value) => {
      if (v.type !== "Record") {
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
    getName: () => `dict(${itemType.getName()})`,
  };
};

export const frAny: FRType<Value> = {
  unpack: (v) => v,
  getName: () => "any",
};

// We currently support records with up to 3 pairs.
// The limit could be increased with the same pattern, but there might be a better solution for this.
export function frRecord<K1 extends string, T1>(
  kv1: [K1, FRType<T1>]
): FRType<{ [k in K1]: T1 }>;
export function frRecord<K1 extends string, T1, K2 extends string, T2>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 }>;
export function frRecord<
  K1 extends string,
  T1,
  K2 extends string,
  T2,
  K3 extends string,
  T3
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>]
): FRType<{ [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 }>;

export function frRecord(
  ...allKvs: [string, FRType<unknown>][]
): FRType<unknown> {
  return {
    unpack: (v: Value) => {
      // extra keys are allowed

      if (v.type !== "Record") {
        return undefined;
      }
      const r = v.value;

      const result: { [k: string]: any } = {};

      for (const [key, valueShape] of allKvs) {
        const subvalue = r.get(key);
        if (subvalue === undefined) {
          return undefined;
        }
        const unpackedSubvalue = valueShape.unpack(subvalue);
        if (unpackedSubvalue === undefined) {
          return undefined;
        }
        result[key] = unpackedSubvalue;
      }
      return result;
    },
    getName: () =>
      "{" +
      allKvs
        .map(([name, frType]) => `${name}: ${frType.getName()}`)
        .join(", ") +
      "}",
  };
}
