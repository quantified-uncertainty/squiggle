import { SquiggleDeserializationVisitor } from "../serialization/squiggle.js";
import { SDate } from "../utility/SDate.js";
import { tDate, tDuration, tPlot } from "./index.js";
import { tArray } from "./TArray.js";
import { TDateRange } from "./TDateRange.js";
import { DictShape, tDict } from "./TDict.js";
import { tDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
import {
  tDist,
  tPointSetDist,
  tSampleSetDist,
  tSymbolicDist,
} from "./TDist.js";
import {
  IntrinsicValueType,
  tBool,
  tCalculator,
  tDomain,
  tInput,
  tLambda,
  tNumber,
  tScale,
  tSpecification,
  tString,
  tTableChart,
} from "./TIntrinsic.js";
import { TNumberRange } from "./TNumberRange.js";
import { tTuple } from "./TTuple.js";
import { tTypedLambda } from "./TTypedLambda.js";
import { tUnion } from "./TUnion.js";
import { tAny, Type } from "./Type.js";

// Serialization code is represented as `serialize()` method on `Type` subclasses.
// Deserialization code is in `deserializeType()` function below.

export type SerializedType =
  | {
      kind: "Intrinsic";
      valueType: IntrinsicValueType;
    }
  | {
      kind: "Any";
      genericName?: string;
    }
  | {
      kind: "Tuple";
      types: number[];
    }
  | {
      kind: "Array";
      itemType: number;
    }
  | {
      kind: "DictWithArbitraryKeys";
      itemType: number;
    }
  | {
      kind: "Union";
      types: number[];
    }
  | {
      kind: "Dict";
      shape: Record<
        string,
        Omit<DictShape[string], "type"> & {
          type: number;
        }
      >;
    }
  | {
      kind: "NumberRange";
      min: number;
      max: number;
    }
  | {
      kind: "DateRange";
      min: number;
      max: number;
    }
  | {
      kind: "Dist";
      distClass?: "Symbolic" | "PointSet" | "SampleSet";
    }
  | {
      kind: "TypedLambda";
      inputs: number[];
      output: number;
    };

export function deserializeType(
  type: SerializedType,
  visit: SquiggleDeserializationVisitor
): Type {
  switch (type.kind) {
    case "Intrinsic":
      switch (type.valueType) {
        case "Bool":
          return tBool;
        case "Number":
          return tNumber;
        case "Date":
          return tDate;
        case "Calculator":
          return tCalculator;
        case "Duration":
          return tDuration;
        case "Lambda":
          return tLambda;
        case "Scale":
          return tScale;
        case "Input":
          return tInput;
        case "Plot":
          return tPlot;
        case "Specification":
          return tSpecification;
        case "String":
          return tString;
        case "TableChart":
          return tTableChart;
        case "Domain":
          return tDomain;
        default:
          throw type.valueType satisfies never;
      }
    case "Any":
      return tAny({ genericName: type.genericName });
    case "NumberRange":
      return new TNumberRange(type.min, type.max);
    case "DateRange":
      return new TDateRange(SDate.fromMs(type.min), SDate.fromMs(type.max));
    case "Array":
      return tArray(visit.type(type.itemType));
    case "Tuple":
      return tTuple(...type.types.map((t) => visit.type(t)));
    case "Union":
      return tUnion(type.types.map(visit.type));
    case "Dict":
      return tDict(
        Object.fromEntries(
          Object.entries(type.shape).map(([key, value]) => [
            key,
            {
              ...value,
              type: visit.type(value.type),
            },
          ])
        )
      );
    case "DictWithArbitraryKeys":
      return tDictWithArbitraryKeys(visit.type(type.itemType));
    case "Dist":
      return type.distClass === "PointSet"
        ? tPointSetDist
        : type.distClass === "SampleSet"
          ? tSampleSetDist
          : type.distClass === "Symbolic"
            ? tSymbolicDist
            : tDist;
    case "TypedLambda":
      return tTypedLambda(
        type.inputs.map((input) => visit.input(input)),
        visit.type(type.output)
      );

    default:
      throw new Error(`Unknown serialized type ${type satisfies never}`);
  }
}
