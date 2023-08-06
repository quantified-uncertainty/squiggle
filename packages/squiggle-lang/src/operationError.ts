export abstract class OperationError {
  // Important for type safety.
  // Requiring only `toString()` method is too generic and caused bugs like https://github.com/quantified-uncertainty/squiggle/issues/2211.
  type = "OperationError";

  abstract toString(): string;
}

export class DivisionByZeroError extends OperationError {
  toString() {
    return "Cannot divide by zero";
  }
}
export class ComplexNumberError extends OperationError {
  toString() {
    return "Operation returned complex result";
  }
}
export class InfinityError extends OperationError {
  toString() {
    return "Operation returned positive infinity";
  }
}
export class NegativeInfinityError extends OperationError {
  toString() {
    return "Operation returned negative infinity";
  }
}
export class SampleMapNeedsNtoNFunction extends OperationError {
  toString() {
    return "SampleMap needs a function that converts a number to a number";
  }
}
export class PdfInvalidError extends OperationError {
  toString() {
    return "This Pdf is invalid";
  }
}

export class OtherOperationError extends OperationError {
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value;
  }
}
