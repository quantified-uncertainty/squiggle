import { BaseDist } from "../../dists/BaseDist.js";
import { PointSetDist } from "../../dists/PointSetDist.js";
import { SampleSetDist } from "../../dists/SampleSetDist/index.js";
import { BaseSymbolicDist } from "../../dists/SymbolicDist/BaseSymbolicDist.js";
import { SymbolicDist } from "../../dists/SymbolicDist/index.js";
import { Lambda } from "../../reducer/lambda.js";
import { ImmutableMap } from "../../utility/immutable.js";
import { SDate } from "../../utility/SDate.js";
import { SDuration } from "../../utility/SDuration.js";
import { Domain } from "../../value/domain.js";
import { Value } from "../../value/index.js";
import { ValueTags } from "../../value/valueTags.js";
import { vArray } from "../../value/VArray.js";
import { vBool } from "../../value/VBool.js";
import { Calculator, vCalculator } from "../../value/VCalculator.js";
import { vDate } from "../../value/VDate.js";
import { vDict } from "../../value/VDict.js";
import { vDist } from "../../value/VDist.js";
import { vDomain } from "../../value/VDomain.js";
import { vDuration } from "../../value/VDuration.js";
import { Input, InputType, vInput } from "../../value/VInput.js";
import { vLambda } from "../../value/vLambda.js";
import { vNumber } from "../../value/VNumber.js";
import { Plot, vPlot } from "../../value/VPlot.js";
import { Scale, vScale } from "../../value/VScale.js";
import {
  Specification,
  vSpecification,
  VSpecification,
} from "../../value/VSpecification.js";
import { vString } from "../../value/VString.js";
import { TableChart, vTableChart } from "../../value/VTableChart.js";
import { InputOrType, inputOrTypeToInput } from "./fnDefinition.js";
import { fnInputsMatchesLengths } from "./helpers.js";

/*
FRType is a function that unpacks a Value.
Each function identifies the specific type and can be used in a function definition signature.
*/
export type FRType<T> = {
  unpack: (v: Value) => T | undefined;
  pack: (v: T) => Value; // used in makeSquiggleDefinition
  display: () => string;
  transparent?: T extends Value ? boolean : undefined;
  varName?: string;
  default?: string;
  fieldType?: InputType;
};

export const frNumber: FRType<number> = {
  unpack: (v: Value) => (v.type === "Number" ? v.value : undefined),
  pack: (v) => vNumber(v),
  display: () => "Number",
  default: "0",
};
export const frTableChart: FRType<TableChart> = {
  unpack: (v: Value) => (v.type === "TableChart" ? v.value : undefined),
  pack: (v) => vTableChart(v),
  display: () => "Table",
  default: "",
  fieldType: "textArea",
};
export const frCalculator: FRType<Calculator> = {
  unpack: (v: Value) => (v.type === "Calculator" ? v.value : undefined),
  pack: (v) => vCalculator(v),
  display: () => "Calculator",
  default: "",
  fieldType: "textArea",
};
export const frSpecification: FRType<Specification> = {
  unpack: (v: Value) => (v.type === "Specification" ? v.value : undefined),
  pack: (v) => vSpecification(v),
  display: () => "Specification",
};
export const frSpecificationWithTags: FRType<VSpecification> = {
  unpack: (v: Value) => (v.type === "Specification" ? v : undefined),
  pack: (v) => v,
  display: () => "Specification",
};
export const frString: FRType<string> = {
  unpack: (v: Value) => (v.type === "String" ? v.value : undefined),
  pack: (v) => vString(v),
  display: () => "String",
  default: "",
};
export const frBool: FRType<boolean> = {
  unpack: (v: Value) => (v.type === "Bool" ? v.value : undefined),
  pack: (v) => vBool(v),
  display: () => "Bool",
  default: "false",
  fieldType: "checkbox",
};
export const frDate: FRType<SDate> = {
  unpack: (v) => (v.type === "Date" ? v.value : undefined),
  pack: (v) => vDate(v),
  display: () => "Date",
  default: "Date(2023)",
};
export const frDuration: FRType<SDuration> = {
  unpack: (v) => (v.type === "Duration" ? v.value : undefined),
  pack: (v) => vDuration(v),
  display: () => "Duration",
  default: "1minutes",
};
export const frDist: FRType<BaseDist> = {
  unpack: (v) => (v.type === "Dist" ? v.value : undefined),
  pack: (v) => vDist(v),
  display: () => "Dist",
  default: "normal(1,1)",
};
export const frDistPointset: FRType<PointSetDist> = {
  unpack: (v) =>
    v.type === "Dist" && v.value instanceof PointSetDist ? v.value : undefined,
  pack: (v) => vDist(v),
  display: () => "PointSetDist",
  default: "PointSet(normal(1,1))",
};

export const frSampleSetDist: FRType<SampleSetDist> = {
  unpack: (v) =>
    v.type === "Dist" && v.value instanceof SampleSetDist ? v.value : undefined,
  pack: (v) => vDist(v),
  display: () => "SampleSetDist",
  default: "(normal(1,1))",
};

export const frDistSymbolic: FRType<SymbolicDist> = {
  unpack: (v) =>
    v.type === "Dist" && v.value instanceof BaseSymbolicDist
      ? v.value
      : undefined,
  pack: (v) => vDist(v),
  display: () => "SymbolicDist",
  default: "Sym.normal(1,1)",
};

export const frLambda: FRType<Lambda> = {
  unpack: (v) => (v.type === "Lambda" ? v.value : undefined),
  pack: (v) => vLambda(v),
  display: () => "Function",
  default: "{|e| e}",
};

export const frLambdaTyped = (
  maybeInputs: InputOrType<any>[],
  output: FRType<any>
): FRType<Lambda> => {
  const inputs = maybeInputs.map(inputOrTypeToInput);

  return {
    unpack: (v: Value) => {
      return v.type === "Lambda" &&
        fnInputsMatchesLengths(inputs, v.value.parameterCounts())
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
    display: () =>
      `(${inputs.map((i) => i.toString()).join(", ")}) => ${output.display()}`,
    default: `{|${inputs.map((i, index) => `x${index}`).join(", ")}| ${
      output.default
    }`,
    fieldType: "textArea",
  };
};

export const frWithTags = <T>(
  itemType: FRType<T>
): FRType<{ value: T; tags: ValueTags }> => {
  return {
    unpack: (v) => {
      const unpackedItem = itemType.unpack(v);
      return (
        (unpackedItem !== undefined && {
          value: unpackedItem,
          tags: v.tags ?? new ValueTags({}),
        }) ||
        undefined
      );
    },
    // This will overwrite the original tags in case of `frWithTags(frAny())`. But in that situation you shouldn't use `frWithTags`, a simple `frAny` will do.
    pack: ({ value, tags }) => itemType.pack(value).copyWithTags(tags),
    display: itemType.display,
    default: itemType.default,
    fieldType: itemType.fieldType,
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
    display: () => `lambda(${paramLengths.join(",")})`,
    default: "",
    fieldType: "textArea",
  };
};

export const frScale: FRType<Scale> = {
  unpack: (v) => (v.type === "Scale" ? v.value : undefined),
  pack: (v) => vScale(v),
  display: () => "Scale",
  default: "",
  fieldType: "textArea",
};

export const frInput: FRType<Input> = {
  unpack: (v) => (v.type === "Input" ? v.value : undefined),
  pack: (v) => vInput(v),
  display: () => "Input",
  default: "",
  fieldType: "textArea",
};
export const frPlot: FRType<Plot> = {
  unpack: (v) => (v.type === "Plot" ? v.value : undefined),
  pack: (v) => vPlot(v),
  display: () => "Plot",
  default: "",
  fieldType: "textArea",
};

export const frDomain: FRType<Domain> = {
  unpack: (v) => (v.type === "Domain" ? v.value : undefined),
  pack: (v) => vDomain(v),
  display: () => "Domain",
  default: "",
};

export const frArray = <T>(itemType: FRType<T>): FRType<readonly T[]> => {
  const isTransparent = itemType.transparent;

  return {
    unpack: (v: Value) => {
      if (v.type !== "Array") {
        return undefined;
      }
      if (isTransparent) {
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
    pack: (v) =>
      isTransparent
        ? vArray(v as readonly Value[])
        : vArray(v.map(itemType.pack)),
    display: () => `List(${itemType.display()})`,
    default: "[]",
    fieldType: "textArea",
  };
};

export type FrOrType<T1, T2> =
  | { tag: "1"; value: T1 }
  | { tag: "2"; value: T2 };

export function frOr<T1, T2>(
  type1: FRType<T1>,
  type2: FRType<T2>
): FRType<FrOrType<T1, T2>> {
  return {
    unpack: (v) => {
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
    pack: (v) => {
      return v.tag === "1" ? type1.pack(v.value) : type2.pack(v.value);
    },
    display: () => `${type1.display()}|${type2.display()}`,
    default: type1.default,
    fieldType: type1.fieldType,
  };
}

//TODO: It would probably eventually be good to refactor this out, to use frOr instead. However, that would be slightly less efficient.
export const frDistOrNumber: FRType<BaseDist | number> = {
  unpack: (v) =>
    v.type === "Dist" ? v.value : v.type === "Number" ? v.value : undefined,
  pack: (v) => (typeof v === "number" ? vNumber(v) : vDist(v)),
  display: () => "Dist|Number",
  default: frDist.default,
};

type UnwrapFRType<T> = T extends FRType<infer U> ? U : never;

export function frTuple<const T extends any[]>(
  ...types: [...{ [K in keyof T]: T[K] }]
): FRType<[...{ [K in keyof T]: UnwrapFRType<T[K]> }]> {
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

      return items as any;
    },
    pack: (values: unknown[]) => {
      return vArray(values.map((val, index) => types[index].pack(val)));
    },
    display: () => `[${types.map((type) => type.display()).join(", ")}]`,
    default: `[${types.map((type) => type.default).join(", ")}]`,
    fieldType: "textArea",
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
    display: () => `Dict(${itemType.display()})`,
    default: "{}",
    fieldType: "textArea",
  };
};

export const frAny = (params?: { genericName?: string }): FRType<Value> => ({
  unpack: (v) => v,
  pack: (v) => v,
  display: () => (params?.genericName ? `'${params.genericName}` : "any"),
  transparent: true,
  default: "",
});

type FROptional<T extends FRType<unknown>> = FRType<UnwrapFRType<T> | null>;

type FRDictDetailedEntry<K extends string, V extends FRType<any>> = {
  key: K;
  type: V;
  optional?: boolean;
  deprecated?: boolean;
};

type FRDictSimpleEntry<K extends string, V extends FRType<any>> = [K, V];

type FRDictEntry<K extends string, V extends FRType<any>> =
  | FRDictDetailedEntry<K, V>
  | FRDictSimpleEntry<K, V>;

export type DictEntryKey<T extends FRDictEntry<any, any>> =
  T extends FRDictDetailedEntry<infer K, any>
    ? K
    : T extends FRDictSimpleEntry<infer K, any>
      ? K
      : never;

type DictEntryType<T extends FRDictEntry<any, any>> =
  T extends FRDictDetailedEntry<any, infer Type>
    ? T extends { optional: true }
      ? FROptional<Type>
      : Type
    : T extends FRDictSimpleEntry<any, infer Type>
      ? Type
      : never;

// The complex generic type here allows us to construct the correct result type based on the input types.
export function frDict<const KVList extends FRDictEntry<any, FRType<any>>[]>(
  ...allKvs: [...{ [K in keyof KVList]: KVList[K] }]
): FRType<{
  [Key in DictEntryKey<KVList[number]>]: UnwrapFRType<
    DictEntryType<Extract<KVList[number], [Key, unknown] | { key: Key }>>
  >;
}> {
  const kvs = allKvs.map(
    (kv): FRDictDetailedEntry<string, FRType<unknown>> =>
      "key" in kv
        ? kv
        : {
            key: kv[0],
            type: kv[1],
            optional: false,
            deprecated: false,
          }
  );

  return {
    unpack: (v: Value) => {
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
      return result as any; // that's ok, we've checked the types in return type
    },
    pack: (v) =>
      vDict(
        ImmutableMap(
          kvs
            .filter((kv) => !kv.optional || (v as any)[kv.key] !== null)
            .map((kv) => [kv.key, kv.type.pack((v as any)[kv.key])])
        )
      ),
    display: () =>
      "{" +
      kvs
        .filter((kv) => !kv.deprecated)
        .map((kv) => `${kv.key}${kv.optional ? "?" : ""}: ${kv.type.display()}`)
        .join(", ") +
      "}",
    default: "{}",
    fieldType: "textArea",
  };
}

export const frMixedSet = frDict(
  ["points", frArray(frNumber)],
  ["segments", frArray(frTuple(frNumber, frNumber))]
);
