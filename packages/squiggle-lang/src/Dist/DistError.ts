import { OperationError, operationErrorToString } from "../OperationError";
import { XYShapeError } from "../XYShape";

export type DistError =
  | {
      type: "NotYetImplemented";
    }
  | {
      type: "Unreachable";
    }
  | {
      type: "DistributionVerticalShiftIsInvalid";
    }
  | {
      type: "TooFewSamples"; // SampleSetDist.Error.TooFewSamples
    }
  | {
      type: "NonNumericInput"; // SampleSetDist.Error.NonNumericInput
      message: string;
    }
  | {
      type: "ArgumentError";
      message: string;
    }
  | {
      type: "OperationError";
      value: OperationError;
    }
  | {
      type: "PointSetConversionError";
      message: "TooFewSamples";
    }
  | {
      type: "SparklineError";
      message: string;
    }
  | {
      type: "RequestedStrategyInvalidError";
      message: string;
    }
  | {
      type: "LogarithmOfDistributionError";
      message: string;
    }
  | {
      type: "OtherError";
      message: string;
    }
  | {
      type: "XYShapeError";
      value: XYShapeError;
    };

export const TooFewSamplesForConversionToPointSet = (): DistError => {
  return {
    type: "PointSetConversionError",
    message: "TooFewSamples",
  };
};

export const DistOperationError = (
  operationError: OperationError
): DistError => {
  return {
    type: "OperationError",
    value: operationError,
  };
};

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
      return operationErrorToString(e.value);
    case "PointSetConversionError":
      return "Too Few Samples to convert to point set"; // always "TooFewSamples"
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
      return `Unknown error type ${(e as any).type}`;
  }
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
