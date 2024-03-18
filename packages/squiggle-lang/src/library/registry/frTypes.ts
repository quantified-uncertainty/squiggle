import { BaseDist } from "../../dist/BaseDist.js";
import { PointSetDist } from "../../dist/PointSetDist.js";
import { SampleSetDist } from "../../dist/SampleSetDist/index.js";
import { SymbolicDist } from "../../dist/SymbolicDist.js";
import { Lambda } from "../../reducer/lambda.js";
import { ImmutableMap } from "../../utility/immutableMap.js";
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
import { Specification, vSpecification } from "../../value/VSpecification.js";
import { vString } from "../../value/VString.js";
import { TableChart, vTableChart } from "../../value/VTableChart.js";
import { frTypesMatchesLengths } from "./helpers.js";

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
  isOptional?: boolean;
  tag?: string;
  underlyingType?: FRType<any>;
  default?: string;
  fieldType?: InputType;
};

export const isOptional = <T>(frType: FRType<T>): boolean => {
  return frType.isOptional === undefined ? false : frType.isOptional;
};

export const isDeprecated = <T>(frType: FRType<T>): boolean => {
  return frType.tag === "deprecated";
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
  fieldType: "textArea",
};
export const frString: FRType<string> = {
  unpack: (v: Value) => (v.type === "String" ? v.value : undefined),
  pack: (v) => vString(v),
  display: () => "String",
  tag: "string",
  default: "",
};
export const frBool: FRType<boolean> = {
  unpack: (v: Value) => (v.type === "Bool" ? v.value : undefined),
  pack: (v) => vBool(v),
  display: () => "Bool",
  tag: "bool",
  default: "false",
  fieldType: "checkbox",
};
export const frDate: FRType<SDate> = {
  unpack: (v) => (v.type === "Date" ? v.value : undefined),
  pack: (v) => vDate(v),
  display: () => "Date",
  tag: "date",
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
    v.type === "Dist" && v.value instanceof SymbolicDist ? v.value : undefined,
  pack: (v) => vDist(v),
  display: () => "SymbolicDist",
  default: "Sym.normal(1,1)",
};

export const frLambda: FRType<Lambda> = {
  unpack: (v) => (v.type === "Lambda" ? v.value : undefined),
  pack: (v) => vLambda(v),
  display: () => "Function",
  tag: "lambda",
  default: "{|e| e}",
};

export const frLambdaTyped = (
  inputs: FRType<any>[],
  output: FRType<any>
): FRType<Lambda> => {
  return {
    unpack: (v: Value) => {
      return v.type === "Lambda" &&
        frTypesMatchesLengths(inputs, v.value.parameterCounts())
        ? v.value
        : undefined;
    },
    pack: (v) => vLambda(v),
    display: () =>
      `(${inputs.map((i) => i.display()).join(", ")}) => ${output.display()}`,
    tag: "lambda",
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
    tag: "lambda",
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
    tag: "array",
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
    display: () => `[${types.map((type) => type.display()).join(", ")}]`,
    tag: "tuple",
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
    tag: "dict",
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
  K7 extends string,
  T7,
>(
  kv1: [K1, FRType<T1>],
  kv2: [K2, FRType<T2>],
  kv3: [K3, FRType<T3>],
  kv4: [K4, FRType<T4>],
  kv5: [K5, FRType<T5>],
  kv6: [K6, FRType<T6>],
  kv7: [K7, FRType<T7>]
): FRType<
  { [k in K1]: T1 } & { [k in K2]: T2 } & { [k in K3]: T3 } & {
    [k in K4]: T4;
  } & { [k in K5]: T5 } & { [k in K6]: T6 } & { [k in K7]: T7 }
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
          if (isOptional(valueShape)) {
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
                !isOptional(valueShape) || (v as any)[key] !== null
            )
            .map(([key, valueShape]) => [key, valueShape.pack((v as any)[key])])
        )
      ),
    display: () =>
      "{" +
      allKvs
        .filter(([_, frType]) => !isDeprecated(frType))
        .map(
          ([name, frType]) =>
            `${name}${isOptional(frType) ? "?" : ""}: ${frType.display()}`
        )
        .join(", ") +
      "}",
    tag: "dict",
    default: "{}",
    fieldType: "textArea",
  };
}

export const frNamed = <T>(name: string, itemType: FRType<T>): FRType<T> => ({
  unpack: itemType.unpack,
  pack: (v) => itemType.pack(v),
  display: () => {
    const _isOptional = isOptional(itemType);
    return `${name}${_isOptional ? "?" : ""}: ${itemType.display()}`;
  },
  isOptional: isOptional(itemType),
  tag: "named",
  underlyingType: itemType,
  varName: name,
  default: itemType.default,
  fieldType: itemType.fieldType,
});

export const frOptional = <T>(itemType: FRType<T>): FRType<T | null> => {
  return {
    unpack: itemType.unpack,
    pack: (v) => {
      if (v === null) {
        // shouldn't happen if frDict implementation is correct and frOptional is used correctly.
        throw new Error("Unable to pack null value");
      }
      return itemType.pack(v);
    },
    display: () => itemType.display(),
    underlyingType: itemType,
    isOptional: true,
    default: itemType.default,
    fieldType: itemType.fieldType,
  };
};

export const frDeprecated = <T>(itemType: FRType<T>): FRType<T> => ({
  unpack: itemType.unpack,
  pack: (v) => itemType.pack(v),
  display: () => ``,
  isOptional: isOptional(itemType),
  tag: "deprecated",
  underlyingType: itemType,
  default: itemType.default,
  fieldType: itemType.fieldType,
});
