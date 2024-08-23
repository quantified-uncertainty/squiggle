import { BaseDist } from "../dists/BaseDist.js";
import { FnInput } from "../reducer/lambda/FnInput.js";
import { Lambda } from "../reducer/lambda/index.js";
import {
  tArray,
  tBool,
  tCalculator,
  tDict,
  tDictWithArbitraryKeys,
  tDist,
  tDomain,
  tDuration,
  tNumber,
  tString,
  tTuple,
  tTypedLambda,
} from "../types/index.js";
import {
  TDist,
  tPointSetDist,
  tSampleSetDist,
  tSymbolicDist,
} from "../types/TDist.js";
import {
  IntrinsicValueType,
  tDate,
  tInput,
  TIntrinsic,
  tLambda,
  tPlot,
  tScale,
  tSpecification,
  tTableChart,
} from "../types/TIntrinsic.js";
import { tUnion } from "../types/TUnion.js";
import { tAny, TAny, Type } from "../types/Type.js";
import { ImmutableMap } from "../utility/immutable.js";
import {
  Value,
  vArray,
  vBool,
  vCalculator,
  vDate,
  vDict,
  vDist,
  vDomain,
  vDuration,
  vInput,
  vLambda,
  vNumber,
  vPlot,
  vScale,
  vString,
  vTableChart,
} from "../value/index.js";
import { ValueTags } from "../value/valueTags.js";
import { vSpecification } from "../value/VSpecification.js";
import { fnInputsMatchesLengths } from "./registry/helpers.js";

/**
 * A FrType is an extension to Type that can be packed and unpacked from a
 * Value.
 *
 * This is useful in Squiggle standard library ("Function Registry", FR),
 * because we implement builtin functions in JavaScript, and we need to convert
 * between Squiggle values and JavaScript values.
 *
 * `unpack()` and `pack()` aren't present on `Type` intentionally, because:
 * 1. There can be several unpackers for a single type (e.g. `frOr` and
 * `frDistOrNumber`)
 * 2. Only `FrType` is generic over the JavaScript type of the value it
 * represents, which allows us to simplify `Type` implementation.
 *
 * The downside of this approach is that we have to define a lot of FrTypes. But
 * the type checking code is generally more complicated than other parts of the
 * codebase, so it's a good tradeoff.
 *
 * Another potential downside is that we could make use of `pack`/`unpack`
 * outside of function registry, to optimize Squiggle compiler. In that case, it
 * could be argued that `pack`/`unpack` should be more tightly coupled with
 * types.
 *
 * Right now we always store packed `Value`s on stack, and unpack them on every
 * builtin function call. We could potentially store unpacked values on stack,
 * and pack them only when needed. But this would require a significant refactor
 * of the compiler, and it's not clear if it would be worth it, especially
 * because values can be tagged and we don't know when tag information should be
 * preserved.
 */
export type FrType<T> = {
  type: Type;
  unpack: (value: Value) => T | undefined;
  pack: (value: T) => Value;
};

export type UnwrapFrType<T extends FrType<any>> = Exclude<
  ReturnType<T["unpack"]>,
  undefined
>;

type ValueTypeToContent<T extends IntrinsicValueType> = Extract<
  Value,
  { type: T }
>["value"];

function frIntrinsic<T extends IntrinsicValueType>(
  valueType: T,
  pack: (value: ValueTypeToContent<T>) => Value,
  type: TIntrinsic<T>
): FrType<ValueTypeToContent<T>> {
  return {
    type,
    unpack: (value) => {
      if (value.type === valueType) {
        return value.value as ValueTypeToContent<T>;
      }
      return undefined;
    },
    pack,
  };
}

export const frNumber = frIntrinsic("Number", vNumber, tNumber);

export const frString = frIntrinsic("String", vString, tString);

export const frBool = frIntrinsic("Bool", vBool, tBool);

export const frDuration = frIntrinsic("Duration", vDuration, tDuration);

export const frDate = frIntrinsic("Date", vDate, tDate);

export const frCalculator = frIntrinsic("Calculator", vCalculator, tCalculator);

export const frLambda = frIntrinsic("Lambda", vLambda, tLambda);

// FIXME - inconsistent name, because `frInput` is already taken for FrInput class
export const frFormInput = frIntrinsic("Input", vInput, tInput);

export const frTableChart = frIntrinsic("TableChart", vTableChart, tTableChart);

export const frSpecification = frIntrinsic(
  "Specification",
  vSpecification,
  tSpecification
);

export const frPlot = frIntrinsic("Plot", vPlot, tPlot);

export const frScale = frIntrinsic("Scale", vScale, tScale);

// TODO - support typed domains
export const frDomain = frIntrinsic("Domain", vDomain, tDomain);

export function frArray<T>(itemType: FrType<T>): FrType<readonly T[]> {
  return {
    type: tArray(itemType.type),
    unpack: (v) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (itemType.type instanceof TAny) {
        // special case, performance optimization
        return v.value as readonly T[];
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
    pack: (v) => {
      return itemType.type instanceof TAny
        ? vArray(v as readonly Value[])
        : vArray(v.map(itemType.pack));
    },
  };
}

export function frAny(params?: { genericName?: string }): FrType<Value> {
  return {
    type: tAny(params),
    unpack: (v) => v,
    pack: (v) => v,
  };
}

export function frDictWithArbitraryKeys<T>(
  itemType: FrType<T>
): FrType<ImmutableMap<string, T>> {
  return {
    type: tDictWithArbitraryKeys(itemType.type),
    unpack: (v) => {
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
    pack(v: ImmutableMap<string, T>) {
      return vDict(
        ImmutableMap([...v.entries()].map(([k, v]) => [k, itemType.pack(v)]))
      );
    },
  };
}

function makeFrDist<T extends BaseDist>(type: TDist<T>): FrType<T> {
  return {
    type,
    unpack: (v: Value) => {
      if (v.type !== "Dist") return undefined;
      if (type.distClass && !(v.value instanceof type.distClass))
        return undefined;
      return v.value as T;
    },
    pack: (v: BaseDist) => vDist(v),
  };
}

export const frDist = makeFrDist(tDist);
export const frPointSetDist = makeFrDist(tPointSetDist);
export const frSampleSetDist = makeFrDist(tSampleSetDist);
export const frSymbolicDist = makeFrDist(tSymbolicDist);

type OrType<T1, T2> = { tag: "1"; value: T1 } | { tag: "2"; value: T2 };

export function frOr<T1, T2>(
  type1: FrType<T1>,
  type2: FrType<T2>
): FrType<OrType<T1, T2>> {
  return {
    type: tUnion([type1.type, type2.type]),
    unpack: (v: Value) => {
      const unpackedType1Value = type1.unpack(v);
      if (unpackedType1Value !== undefined) {
        return { tag: "1", value: unpackedType1Value };
      }
      const unpackedType2Value = type2.unpack(v);
      if (unpackedType2Value !== undefined) {
        return { tag: "2", value: unpackedType2Value };
      }
      return undefined;
    },
    pack(v) {
      return v.tag === "1" ? type1.pack(v.value) : type2.pack(v.value);
    },
  };
}

export const frDistOrNumber: FrType<BaseDist | number> = {
  type: tUnion([tDist, tNumber]),
  unpack: (v) => {
    if (v.type === "Dist" || v.type === "Number") {
      return v.value;
    }
    return undefined;
  },
  pack: (v) => (typeof v === "number" ? vNumber(v) : vDist(v)),
};

export function frTuple<T extends readonly FrType<any>[]>(
  ...types: T
): FrType<{ [K in keyof T]: UnwrapFrType<T[K]> }> {
  return {
    type: tTuple(...types.map((type) => type.type)),
    unpack: (v) => {
      if (v.type !== "Array" || v.value.length !== types.length) {
        return undefined;
      }
      const items: unknown[] = [];
      for (let i = 0; i < types.length; i++) {
        const item = types[i].unpack(v.value[i]);
        if (item === undefined) {
          return undefined;
        }
        items.push(item);
      }
      return items as any;
    },
    pack(v) {
      return vArray(v.map((val, index) => types[index].pack(val)));
    },
  };
}

type OptionalType<T extends FrType<unknown>> = FrType<UnwrapFrType<T> | null>;

export type DetailedEntry<K extends string, V extends FrType<any>> = {
  key: K;
  type: V;
  optional?: boolean;
  deprecated?: boolean;
};

type SimpleEntry<K extends string, V extends FrType<any>> = [K, V];

type DictEntry<K extends string, V extends FrType<any>> =
  | DetailedEntry<K, V>
  | SimpleEntry<K, V>;

export type DictEntryKey<T extends DictEntry<any, any>> =
  T extends DetailedEntry<infer K, any>
    ? K
    : T extends SimpleEntry<infer K, any>
      ? K
      : never;

type DictEntryType<T extends DictEntry<any, any>> =
  T extends DetailedEntry<any, infer Type>
    ? T extends { optional: true }
      ? OptionalType<Type>
      : Type
    : T extends SimpleEntry<any, infer Type>
      ? Type
      : never;

type BaseKVList = DictEntry<any, FrType<any>>[];

// The complex generic type here allows us to construct the correct type parameter based on the input types.
type KVListToDict<KVList extends BaseKVList> = {
  [Key in DictEntryKey<KVList[number]>]: UnwrapFrType<
    DictEntryType<Extract<KVList[number], [Key, unknown] | { key: Key }>>
  >;
};

export function frDict<const KVList extends BaseKVList>(
  // TODO - array -> record
  ...allKvs: [...{ [K in keyof KVList]: KVList[K] }]
): FrType<KVListToDict<KVList>> {
  const kvs = allKvs.map(
    (kv): DetailedEntry<string, FrType<unknown>> =>
      "key" in kv
        ? kv
        : {
            key: kv[0],
            type: kv[1],
            optional: false,
            deprecated: false,
          }
  );
  const type = tDict(
    Object.fromEntries(
      kvs.map((kv) => [
        kv.key,
        {
          type: kv.type.type,
          deprecated: kv.deprecated ?? false,
          optional: kv.optional ?? false,
        },
      ])
    )
  );

  return {
    type,
    unpack(v: Value) {
      // extra keys are allowed

      if (v.type !== "Dict") {
        return undefined;
      }
      const r = v.value;

      const result: { [k: string]: any } = {};

      for (const kv of kvs) {
        const subvalue = r.get(kv.key);
        if (subvalue === undefined) {
          if (kv.optional) {
            // that's ok!
            continue;
          }
          return undefined;
        }
        const unpackedSubvalue = kv.type.unpack(subvalue);
        if (unpackedSubvalue === undefined) {
          return undefined;
        }
        result[kv.key] = unpackedSubvalue;
      }
      return result as KVListToDict<KVList>; // that's ok, we've checked the types in the class type
    },

    pack(v: KVListToDict<KVList>) {
      return vDict(
        ImmutableMap(
          kvs
            .filter((kv) => !kv.optional || (v as any)[kv.key] !== null)
            .map((kv) => [kv.key, kv.type.pack((v as any)[kv.key])])
        )
      );
    },
  };
}

export const frMixedSet = frDict(
  ["points", frArray(frNumber)],
  ["segments", frArray(frTuple(frNumber, frNumber))]
);

export function frTypedLambda(
  maybeInputs: (FnInput | Type)[],
  output: Type
): FrType<Lambda> {
  const inputs = maybeInputs.map((item) =>
    item instanceof Type ? new FnInput({ type: item }) : item
  );

  const type = tTypedLambda(inputs, output);

  return {
    type,
    unpack: (v) => {
      return v.type === "Lambda" &&
        // TODO - compare signatures
        fnInputsMatchesLengths(inputs, v.value.parameterCounts())
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
  };
}

// This FrType is a hack. It's used to create assert definitions that are used to guard against ambiguous function calls.
// TODO: analyze the definitions for ambiguity directly in `fnDefinition.ts` code.
export function frLambdaNand(paramLengths: number[]): FrType<Lambda> {
  return {
    type: tLambda,
    unpack: (v) => {
      const counts = v.type === "Lambda" && v.value.parameterCounts();
      return counts && paramLengths.every((p) => counts.includes(p))
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
  };
}

export function frTagged<T>(type: FrType<T>): FrType<{
  value: T;
  tags: ValueTags;
}> {
  return {
    type: type.type,
    unpack: (v) => {
      const unpackedItem = type.unpack(v);
      if (unpackedItem === undefined) {
        return undefined;
      }
      return {
        value: unpackedItem,
        tags: v.tags ?? new ValueTags({}),
      };
    },
    // This will overwrite the original tags in case of `frTagged(frAny())`. But
    // in that situation you shouldn't use `frTagged`, a simple `frAny` will do.
    // (TODO: this is not true anymore, `frAny` can be valid for the sake of naming a generic type; investigate)
    pack: ({ value, tags }) => type.pack(value).copyWithTags(tags),
  };
}
