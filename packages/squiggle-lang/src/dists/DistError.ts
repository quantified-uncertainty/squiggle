import { OperationError } from "../operationError.js";
import { XYShapeError } from "../XYShape.js";

type SimpleError<S extends string> = { type: S };
type StringError<S extends string> = { type: S; message: string };
type ValueError<S extends string, V> = { type: S; value: V };

export type DistError =
  | SimpleError<"NotYetImplemented">
  | SimpleError<"Unreachable">
  | SimpleError<"DistributionVerticalShiftIsInvalid">
  | SimpleError<"TooFewSamples"> // SampleSetDist.Error.TooFewSamples
  | SimpleError<"TooFewSamplesForConversionToPointSet">
  | StringError<"NonNumericInput"> // SampleSetDist.Error.NonNumericInput
  | StringError<"ArgumentError">
  | StringError<"SparklineError">
  | StringError<"RequestedStrategyInvalidError">
  | StringError<"LogarithmOfDistributionError">
  | StringError<"OtherError">
  | ValueError<"OperationError", OperationError>
  | ValueError<"XYShapeError", XYShapeError>;

export const tooFewSamplesForConversionToPointSet = (): DistError => {
  return {
    type: "TooFewSamplesForConversionToPointSet",
  };
};

export const distOperationError = (
  operationError: OperationError
): DistError => {
  return {
    type: "OperationError",
    value: operationError,
  };
};

export const notYetImplemented = (): DistError => ({
  type: "NotYetImplemented",
});

export const unreachableError = (): DistError => ({
  type: "Unreachable",
});

export const distributionVerticalShiftIsInvalid = (): DistError => ({
  type: "DistributionVerticalShiftIsInvalid",
});

export const operationDistError = (e: OperationError): DistError => ({
  type: "OperationError",
  value: e,
});

export const sparklineError = (e: string): DistError => ({
  type: "SparklineError",
  message: e,
});

export const logarithmOfDistributionError = (e: string): DistError => ({
  type: "LogarithmOfDistributionError",
  message: e,
});

export const requestedStrategyInvalidError = (e: string): DistError => ({
  type: "RequestedStrategyInvalidError",
  message: e,
});

export const otherError = (e: string): DistError => ({
  type: "OtherError",
  message: e,
});

export const argumentError = (e: string): DistError => ({
  type: "ArgumentError",
  message: e,
});

export const xyShapeDistError = (e: XYShapeError): DistError => ({
  type: "XYShapeError",
  value: e,
});

export const distErrorToString = (e: DistError): string => {
  switch (e.type) {
    case "NotYetImplemented":
      return "Function not yet implemented";
    case "Unreachable":
      return "Unreachable";
    case "DistributionVerticalShiftIsInvalid":
      return "Distribution vertical shift is invalid";
    case "ArgumentError":
      return `Argument Error ${e.message}`;
    case "LogarithmOfDistributionError":
      return `Logarithm of input error: ${e.message}`;
    case "NonNumericInput":
      return `Found a non-number in input: ${e.message}`;
    case "OperationError":
      return e.value.toString();
    case "TooFewSamplesForConversionToPointSet":
      return "Too Few Samples to convert to point set";
    case "SparklineError":
      return e.message;
    case "RequestedStrategyInvalidError":
      return `Requested strategy invalid: ${e.message}`;
    case "XYShapeError":
      return `XY Shape Error: ${XYShapeError.toString(e.value)}`;
    case "OtherError":
      return e.message;
    case "TooFewSamples":
      return "Too few samples when constructing sample set";
    default:
      return `Unknown error ${JSON.stringify(e satisfies never)}`;
  }
};
