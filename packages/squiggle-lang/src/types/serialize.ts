import { SquiggleDeserializationVisitor } from "../serialization/squiggle.js";
import { SDate } from "../utility/SDate.js";
import { tDate, tDuration, tPlot } from "./index.js";
import { tArray } from "./TArray.js";
import { TDateRange } from "./TDateRange.js";
import { DetailedEntry, tDict } from "./TDict.js";
import { tDictWithArbitraryKeys } from "./TDictWithArbitraryKeys.js";
import {
  tDist,
  tPointSetDist,
  tSampleSetDist,
  tSymbolicDist,
} from "./TDist.js";
import { tDistOrNumber } from "./TDistOrNumber.js";
import { tDomain } from "./TDomain.js";
import {
  IntrinsicValueType,
  tBool,
  tCalculator,
  tInput,
  tLambda,
  tNumber,
  tScale,
  tSpecification,
  tString,
  tTableChart,
} from "./TIntrinsic.js";
import { tLambdaNand } from "./TLambdaNand.js";
import { TNumberRange } from "./TNumberRange.js";
import { tOr } from "./TOr.js";
import { tTagged } from "./TTagged.js";
import { tTuple } from "./TTuple.js";
import { tTypedLambda } from "./TTypedLambda.js";
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
      kind: "DistOrNumber";
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
      kind: "WithTags";
      itemType: number;
    }
  | {
      kind: "Domain";
      type: number;
    }
  | {
      kind: "DictWithArbitraryKeys";
      itemType: number;
    }
  | {
      kind: "Or";
      type1: number;
      type2: number;
    }
  | {
      kind: "Dict";
      kvs: (Omit<DetailedEntry<string, Type<unknown>>, "type"> & {
        type: number;
      })[];
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
      kind: "LambdaNand";
      paramLengths: number[];
    }
  | {
      kind: "TypedLambda";
      inputs: number[];
      output: number;
    };

export function deserializeType(
  type: SerializedType,
  visit: SquiggleDeserializationVisitor
): Type<unknown> {
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
    case "WithTags":
      return tTagged(visit.type(type.itemType));
    case "Tuple":
      return tTuple(...type.types.map((t) => visit.type(t)));
    case "Or":
      return tOr(visit.type(type.type1), visit.type(type.type2));
    case "Dict":
      return tDict(
        ...type.kvs.map((kv) => ({
          ...kv,
          type: visit.type(kv.type),
        }))
      );
    case "DictWithArbitraryKeys":
      return tDictWithArbitraryKeys(visit.type(type.itemType));
    case "DistOrNumber":
      return tDistOrNumber;
    case "Domain":
      return tDomain(visit.type(type.type));
    case "Dist":
      return type.distClass === "PointSet"
        ? tPointSetDist
        : type.distClass === "SampleSet"
          ? tSampleSetDist
          : type.distClass === "Symbolic"
            ? tSymbolicDist
            : tDist;
    case "LambdaNand":
      return tLambdaNand(type.paramLengths);
    case "TypedLambda":
      return tTypedLambda(
        type.inputs.map((input) => visit.input(input)),
        visit.type(type.output)
      );

    default:
      throw new Error(`Unknown serialized type ${type satisfies never}`);
  }
}
