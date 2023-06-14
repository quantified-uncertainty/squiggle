import { DistError, distErrorToString } from "./dist/DistError.js";
import { OperationError } from "./operationError.js";

// Common error types.

// Messages don't contain any stack trace information.
// Stdlib functions are allowed to throw messages, because they will be caught later
// and wrapped in `IError.rethrowWithFrameStack`.
export abstract class ErrorMessage extends Error {
  abstract toString(): string;
}

export class REArityError extends ErrorMessage {
  constructor(
    public fn: string | undefined,
    public arity: number,
    public usedArity: number
  ) {
    super();
  }

  toString() {
    return `${this.arity} arguments expected. Instead ${this.usedArity} argument(s) were passed.`;
  }
}

export class REArrayIndexNotFound extends ErrorMessage {
  constructor(public msg: string, public index: number) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }
}

export class REDistributionError extends ErrorMessage {
  constructor(public err: DistError) {
    super();
  }

  toString() {
    return `Distribution Math Error: ${distErrorToString(this.err)}`;
  }
}

export class REExpectedType extends ErrorMessage {
  constructor(public typeName: string, public valueString: string) {
    super();
  }

  toString() {
    return `Expected type: ${this.typeName} but got: ${this.valueString}`;
  }
}

export class RENotAFunction extends ErrorMessage {
  constructor(public value: string) {
    super();
  }

  toString() {
    return `${this.value} is not a function`;
  }
}

export class REOperationError extends ErrorMessage {
  constructor(public err: OperationError) {
    super();
  }

  toString() {
    return `Math Error: ${this.err.toString()}`;
  }
}

export class RERecordPropertyNotFound extends ErrorMessage {
  constructor(public msg: string, public index: string) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }
}

export class RESymbolNotFound extends ErrorMessage {
  constructor(public symbolName: string) {
    super();
  }

  toString() {
    return `${this.symbolName} is not defined`;
  }
}

export class RESyntaxError extends ErrorMessage {
  constructor(public desc: string) {
    super();
  }

  toString() {
    return `Syntax Error: ${this.desc}`;
  }
}

export class RETodo extends ErrorMessage {
  constructor(public msg: string) {
    super();
  }

  toString() {
    return `TODO: ${this.msg}`;
  }
}

export class RENeedToRun extends ErrorMessage {
  constructor() {
    super();
  }

  toString() {
    return "Need to run";
  }
}

// Wrapped JavaScript exception. See IError class for details.
export class REJavaScriptExn extends ErrorMessage {
  constructor(public msg: string, public name: string) {
    super();
  }

  toString() {
    let answer = `JS Exception: ${this.name}`;
    if (this.msg.length) answer += `: ${this.msg}`;
    return answer;
  }
}

export class REOther extends ErrorMessage {
  constructor(public msg: string) {
    super();
  }

  toString() {
    return `Error: ${this.msg}`;
  }
}
