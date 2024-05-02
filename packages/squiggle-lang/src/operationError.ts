export abstract class BaseOperationError<T extends string> {
  // This field is useful for serialization, but also for type safety.
  // Requiring only `toString()` method is too generic and caused bugs like https://github.com/quantified-uncertainty/squiggle/issues/2211.
  abstract type: T;

  abstract toString(): string;

  serialize() {
    return { type: this.type };
  }
}

export class DivisionByZeroError extends BaseOperationError<"DivisionByZeroError"> {
  readonly type = "DivisionByZeroError" as const;
  toString() {
    return "Cannot divide by zero";
  }
}
export class ComplexNumberError extends BaseOperationError<"ComplexNumberError"> {
  readonly type = "ComplexNumberError";
  toString() {
    return "Operation returned complex result";
  }
}
export class InfinityError extends BaseOperationError<"InfinityError"> {
  readonly type = "InfinityError";
  toString() {
    return "Operation returned positive infinity";
  }
}
export class NegativeInfinityError extends BaseOperationError<"NegativeInfinityError"> {
  readonly type = "NegativeInfinityError";
  toString() {
    return "Operation returned negative infinity";
  }
}
export class SampleMapNeedsNtoNFunction extends BaseOperationError<"SampleMapNeedsNtoNFunction"> {
  readonly type = "SampleMapNeedsNtoNFunction";
  toString() {
    return "SampleMap needs a function that converts a number to a number";
  }
}
export class PdfInvalidError extends BaseOperationError<"PdfInvalidError"> {
  readonly type = "PdfInvalidError";
  toString() {
    return "This Pdf is invalid";
  }
}

export class OtherOperationError extends BaseOperationError<"OtherOperationError"> {
  readonly type = "OtherOperationError";
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value;
  }

  override serialize() {
    return { type: this.type, value: this.value } as const;
  }
}

export type OperationError =
  | DivisionByZeroError
  | ComplexNumberError
  | InfinityError
  | NegativeInfinityError
  | SampleMapNeedsNtoNFunction
  | PdfInvalidError
  | OtherOperationError;

type SerializedOperationError = ReturnType<OperationError["serialize"]>;

export function deserializeOperationError(
  serialized: SerializedOperationError
): OperationError {
  switch (serialized.type) {
    case "DivisionByZeroError":
      return new DivisionByZeroError();
    case "ComplexNumberError":
      return new ComplexNumberError();
    case "InfinityError":
      return new InfinityError();
    case "NegativeInfinityError":
      return new NegativeInfinityError();
    case "SampleMapNeedsNtoNFunction":
      return new SampleMapNeedsNtoNFunction();
    case "PdfInvalidError":
      return new PdfInvalidError();
    case "OtherOperationError":
      return new OtherOperationError(serialized.value);
  }
}
