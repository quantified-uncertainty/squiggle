export enum SimpleOperationError {
  DivisionByZeroError,
  ComplexNumberError,
  InfinityError,
  NegativeInfinityError,
  SampleMapNeedsNtoNFunction,
  PdfInvalidError,
  NotYetImplemented, // should be removed when `klDivergence` for mixed and discrete is implemented.
}

export type OperationError =
  | {
      type: "enum";
      value: SimpleOperationError;
    }
  | {
      type: "string";
      value: string;
    };

const makeEnumError = (t: SimpleOperationError): OperationError => ({
  type: "enum",
  value: t,
});

export const ComplexNumberError = makeEnumError(
  SimpleOperationError.ComplexNumberError
);

export const DivisionByZeroError = makeEnumError(
  SimpleOperationError.DivisionByZeroError
);

export const NegativeInfinityError = makeEnumError(
  SimpleOperationError.NegativeInfinityError
);

export const PdfInvalidError = makeEnumError(
  SimpleOperationError.PdfInvalidError
);

export const SampleMapNeedsNtoNFunction = makeEnumError(
  SimpleOperationError.SampleMapNeedsNtoNFunction
);

export const makeOtherError = (value: string): OperationError => ({
  type: "string",
  value,
});

export const operationErrorToString = (error: OperationError) => {
  if (error.type === "enum") {
    switch (error.value) {
      case SimpleOperationError.DivisionByZeroError:
        return "Cannot divide by zero";
      case SimpleOperationError.ComplexNumberError:
        return "Operation returned complex result";
      case SimpleOperationError.InfinityError:
        return "Operation returned positive infinity";
      case SimpleOperationError.NegativeInfinityError:
        return "Operation returned negative infinity";
      case SimpleOperationError.SampleMapNeedsNtoNFunction:
        return "SampleMap needs a function that converts a number to a number";
      case SimpleOperationError.PdfInvalidError:
        return "This Pdf is invalid";
      case SimpleOperationError.NotYetImplemented:
        return "This pathway is not yet implemented";
    }
  } else if (error.type === "string") {
    return error.value;
  } else {
    throw new Error("Unknown operation error");
  }
};
