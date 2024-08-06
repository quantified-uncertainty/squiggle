import { SquiggleDeserializationVisitor } from "../serialization/squiggle.js";
import { SDate } from "../utility/SDate.js";
import { tArray } from "./TArray.js";
import { tBool } from "./TBool.js";
import { tCalculator } from "./TCalculator.js";
import { tDate } from "./TDate.js";
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
import { tDuration } from "./TDuration.js";
import { tInput } from "./TInput.js";
import { tLambda } from "./TLambda.js";
import { tLambdaNand } from "./TLambdaNand.js";
import { tNumber } from "./TNumber.js";
import { tOr } from "./TOr.js";
import { tPlot } from "./TPlot.js";
import { tScale } from "./TScale.js";
import { tSpecification } from "./TSpecification.js";
import { tSpecificationWithTags } from "./TSpecificationWithTags.js";
import { tString } from "./TString.js";
import { tTableChart } from "./TTableChart.js";
import { tTuple } from "./TTuple.js";
import { tLambdaTyped } from "./TTypedLambda.js";
import { tWithTags } from "./TWithTags.js";
import { tAny, Type } from "./Type.js";

export type SerializedType =
  | {
      kind:
        | "Bool"
        | "Number"
        | "Plot"
        | "String"
        | "Date"
        | "Duration"
        | "Calculator"
        | "Scale"
        | "Input"
        | "Lambda"
        | "Specification"
        | "SpecificationWithTags"
        | "DistOrNumber"
        | "TableChart";
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
    case "Any":
      return tAny({ genericName: type.genericName });
    case "DateRange":
      return new TDateRange(SDate.fromMs(type.min), SDate.fromMs(type.max));
    case "Array":
      return tArray(visit.type(type.itemType));
    case "WithTags":
      return tWithTags(visit.type(type.itemType));
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
    case "SpecificationWithTags":
      return tSpecificationWithTags;
    case "DistOrNumber":
      return tDistOrNumber;
    case "Lambda":
      return tLambda;
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
      return tLambdaTyped(
        type.inputs.map((input) => visit.input(input)),
        visit.type(type.output)
      );

    default:
      throw new Error(`Unknown serialized type ${type satisfies never}`);
  }
}
