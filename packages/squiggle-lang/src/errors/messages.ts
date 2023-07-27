import { DistError, distErrorToString } from "../dist/DistError.js";
import { OperationError } from "../operationError.js";
import { VDomain, Value } from "../value/index.js";

// Common error types.

// Messages don't contain any stack trace information.
// Stdlib functions are allowed to throw messages, because they will be caught later
// and wrapped in `IError.rethrowWithFrameStack`.
export abstract class ErrorMessage extends Error {
  abstract errorTypeName: string;
  abstract override toString(): string;
}

export class REArityError extends ErrorMessage {
  readonly errorTypeName = "Arity";
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
  readonly errorTypeName = "Array Index Not Found";
  constructor(public msg: string, public index: number) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }
}

export class REDistributionError extends ErrorMessage {
  readonly errorTypeName = "Distribution Math";
  constructor(public err: DistError) {
    super();
  }

  toString() {
    return `${distErrorToString(this.err)}`;
  }
}

export class REExpectedType extends ErrorMessage {
  readonly errorTypeName = "Expected Type";
  constructor(public typeName: string, public valueString: string) {
    super();
  }

  toString() {
    return `Expected type: ${this.typeName} but got: ${this.valueString}`;
  }
}

export class RENotAFunction extends ErrorMessage {
  readonly errorTypeName = "Not a Function";
  constructor(public value: string) {
    super();
  }

  toString() {
    return `${this.value} is not a function`;
  }
}

export class REOperationError extends ErrorMessage {
  readonly errorTypeName = "Math Operation";
  constructor(public err: OperationError) {
    super();
  }

  toString() {
    return `${this.err.toString()}`;
  }
}

export class REDictPropertyNotFound extends ErrorMessage {
  readonly errorTypeName = "Dict Property Not Found";
  constructor(public msg: string, public index: string) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }
}

export class RESymbolNotFound extends ErrorMessage {
  readonly errorTypeName = "Symbol Not Found";
  constructor(public symbolName: string) {
    super();
  }

  toString() {
    return `${this.symbolName} is not defined`;
  }
}

export class RESyntaxError extends ErrorMessage {
  readonly errorTypeName = "Syntax";
  constructor(public desc: string) {
    super();
  }

  toString() {
    return `${this.desc}`;
  }
}

export class RETodo extends ErrorMessage {
  readonly errorTypeName = "Undefined";

  constructor(public msg: string) {
    super();
  }

  toString() {
    return `${this.msg}`;
  }
}

export class REDomainError extends ErrorMessage {
  readonly errorTypeName = "Domain";
  constructor(public value: Value, public domain: VDomain) {
    super();
  }

  toString() {
    return `Domain Error: Parameter ${this.value} must be in domain ${this.domain}`;
  }
}

// Wrapped JavaScript exception. See IError class for details.
export class REJavaScriptExn extends ErrorMessage {
  readonly errorTypeName = "Javascript";
  constructor(public msg: string, public override name: string) {
    super();
  }

  toString() {
    let answer = `JS Exception: ${this.name}`;
    if (this.msg.length) answer += `: ${this.msg}`;
    return answer;
  }
}

export class REArgumentError extends ErrorMessage {
  readonly errorTypeName = "Function Arguments";
  constructor(public msg: string) {
    super();
  }

  toString() {
    return `${this.msg}`;
  }
}

export class REOther extends ErrorMessage {
  readonly errorTypeName = "Generic";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `${this.msg}`;
  }
}

// Discriminated union...
