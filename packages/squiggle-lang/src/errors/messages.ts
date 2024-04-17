import {
  deserializeDistError,
  DistError,
  distErrorToString,
  serializeDistError,
} from "../dists/DistError.js";
import {
  deserializeOperationError,
  OperationError,
} from "../operationError.js";

// Common error types.

// Messages don't contain any stack trace information.
// Stdlib functions are allowed to throw messages, because they will be caught later
// and wrapped in `IRuntimeError.fromException` with the correct stacktrace.
export abstract class BaseErrorMessage extends Error {
  abstract type: string;
  abstract override toString(): string;
}

export class REArityError extends BaseErrorMessage {
  readonly type = "REArityError";
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

  serialize() {
    return {
      type: this.type,
      fn: this.fn ?? null,
      arity: this.arity,
      usedArity: this.usedArity,
    } as const;
  }
}

export class REArrayIndexNotFound extends BaseErrorMessage {
  readonly type = "REArrayIndexNotFound";
  constructor(
    public msg: string,
    public index: number
  ) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
      index: this.index,
    } as const;
  }
}

export class REDistributionError extends BaseErrorMessage {
  readonly type = "REDistributionError";
  constructor(public err: DistError) {
    super();
  }

  toString() {
    return `Distribution Math Error: ${distErrorToString(this.err)}`;
  }

  serialize() {
    return {
      type: this.type,
      err: serializeDistError(this.err),
    } as const;
  }
}

export class REExpectedType extends BaseErrorMessage {
  readonly type = "REExpectedType";
  constructor(
    public typeName: string,
    public valueString: string
  ) {
    super();
  }

  toString() {
    return `Expected type: ${this.typeName} but got: ${this.valueString}`;
  }

  serialize() {
    return {
      type: this.type,
      typeName: this.typeName,
      valueString: this.valueString,
    } as const;
  }
}

export class RENotAFunction extends BaseErrorMessage {
  readonly type = "RENotAFunction";
  constructor(public value: string) {
    super();
  }

  toString() {
    return `${this.value} is not a function`;
  }

  serialize() {
    return {
      type: this.type,
      value: this.value,
    } as const;
  }
}

export class RENotADecorator extends BaseErrorMessage {
  readonly type = "RENotADecorator";
  constructor(public value: string) {
    super();
  }

  toString() {
    return `${this.value} is not a decorator`;
  }

  serialize() {
    return {
      type: this.type,
      value: this.value,
    } as const;
  }
}

export class REOperationError extends BaseErrorMessage {
  readonly type = "REOperationError";
  constructor(public err: OperationError) {
    super();
  }

  toString() {
    return `Math Error: ${this.err.toString()}`;
  }

  serialize() {
    return {
      type: this.type,
      err: this.err.serialize(),
    } as const;
  }
}

export class REDictPropertyNotFound extends BaseErrorMessage {
  readonly type = "REDictPropertyNotFound";
  constructor(
    public msg: string,
    public index: string
  ) {
    super();
  }

  toString() {
    return `${this.msg}: ${this.index}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
      index: this.index,
    } as const;
  }
}

export class RESymbolNotFound extends BaseErrorMessage {
  readonly type = "RESymbolNotFound";
  constructor(public symbolName: string) {
    super();
  }

  toString() {
    return `${this.symbolName} is not defined`;
  }

  serialize() {
    return {
      type: this.type,
      symbolName: this.symbolName,
    } as const;
  }
}

export class RESyntaxError extends BaseErrorMessage {
  readonly type = "RESyntaxError";
  constructor(public desc: string) {
    super();
  }

  toString() {
    return `Syntax Error: ${this.desc}`;
  }

  serialize() {
    return {
      type: this.type,
      desc: this.desc,
    } as const;
  }
}

export class RETodo extends BaseErrorMessage {
  readonly type = "RETodo";
  constructor(public msg: string) {
    super();
  }

  toString() {
    return `TODO: ${this.msg}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
    } as const;
  }
}

export class REDomainError extends BaseErrorMessage {
  readonly type = "REDomainError";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `Domain Error: ${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.message,
    } as const;
  }
}

export class REArgumentDomainError extends BaseErrorMessage {
  readonly type = "REArgumentDomainError";
  constructor(
    public idx: number,
    public error: REDomainError
  ) {
    super(error.msg);
  }

  toString() {
    return `Domain Error: ${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      idx: this.idx,
      error: this.error.serialize(),
    } as const;
  }
}

// Wrapped JavaScript exception. See IError class for details.
export class REJavaScriptExn extends BaseErrorMessage {
  readonly type = "REJavaScriptExn";
  constructor(
    public msg: string,
    public override name: string
  ) {
    super();
  }

  toString() {
    let answer = `JS Exception: ${this.name}`;
    if (this.msg.length) answer += `: ${this.msg}`;
    return answer;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
      name: this.name,
    } as const;
  }
}

export class REArgumentError extends BaseErrorMessage {
  readonly type = "REArgumentError";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `Argument Error: ${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
    } as const;
  }
}

export class REOther extends BaseErrorMessage {
  readonly type = "REOther";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `Error: ${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
    } as const;
  }
}

export class REAmbiguous extends BaseErrorMessage {
  readonly type = "REAmbiguous";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `Ambiguous Error: ${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
    } as const;
  }
}

// Used for user-created throw() function calls
export class REThrow extends BaseErrorMessage {
  readonly type = "REThrow";
  constructor(public msg: string) {
    super(msg);
  }

  toString() {
    return `${this.message}`;
  }

  serialize() {
    return {
      type: this.type,
      msg: this.msg,
    } as const;
  }
}

export type ErrorMessage =
  | REArityError
  | REArrayIndexNotFound
  | REDistributionError
  | REExpectedType
  | RENotAFunction
  | RENotADecorator
  | REOperationError
  | REDictPropertyNotFound
  | RESymbolNotFound
  | RESyntaxError
  | RETodo
  | REDomainError
  | REArgumentDomainError
  | REJavaScriptExn
  | REArgumentError
  | REOther
  | REAmbiguous
  | REThrow;

export type SerializedErrorMessage = ReturnType<ErrorMessage["serialize"]>;

export function deserializeErrorMessage(
  serialized: SerializedErrorMessage
): ErrorMessage {
  switch (serialized.type) {
    case "REArityError":
      return new REArityError(
        serialized.fn ?? undefined,
        serialized.arity,
        serialized.usedArity
      );
    case "REArrayIndexNotFound":
      return new REArrayIndexNotFound(serialized.msg, serialized.index);
    case "REDistributionError":
      return new REDistributionError(deserializeDistError(serialized.err));
    case "REExpectedType":
      return new REExpectedType(serialized.typeName, serialized.valueString);
    case "RENotAFunction":
      return new RENotAFunction(serialized.value);
    case "RENotADecorator":
      return new RENotADecorator(serialized.value);
    case "REOperationError":
      return new REOperationError(deserializeOperationError(serialized.err));
    case "REDictPropertyNotFound":
      return new REDictPropertyNotFound(serialized.msg, serialized.index);
    case "RESymbolNotFound":
      return new RESymbolNotFound(serialized.symbolName);
    case "RESyntaxError":
      return new RESyntaxError(serialized.desc);
    case "RETodo":
      return new RETodo(serialized.msg);
    case "REDomainError":
      return new REDomainError(serialized.msg);
    case "REArgumentDomainError":
      return new REArgumentDomainError(
        serialized.idx,
        new REDomainError(serialized.error.msg)
      );
    case "REJavaScriptExn":
      return new REJavaScriptExn(serialized.msg, serialized.name);
    case "REArgumentError":
      return new REArgumentError(serialized.msg);
    case "REOther":
      return new REOther(serialized.msg);
    case "REAmbiguous":
      return new REAmbiguous(serialized.msg);
    case "REThrow":
      return new REThrow(serialized.msg);
    default:
      throw new Error(`Unknown serialized value ${serialized satisfies never}`);
  }
}
