import { LocationRange } from "../ast/types.js";
import { ICompileError, IError, IRuntimeError } from "../errors/IError.js";
import { StackTraceFrame } from "../reducer/StackTrace.js";
import { Import } from "./SqProject/SqModule.js";

export function wrapIError(err: IError): SqError {
  if (err instanceof IRuntimeError) {
    return new SqRuntimeError(err);
  } else if (err instanceof ICompileError) {
    return new SqCompileError(err);
  } else {
    throw err satisfies never;
  }
}

abstract class SqAbstractError<T extends string> {
  abstract tag: T;

  abstract toString(): string;

  // Includes the full stack trace for runtime errors.
  abstract toStringWithDetails(): string;
}

export class SqFrame {
  constructor(private _value: StackTraceFrame) {}

  name(): string {
    return this._value.name;
  }

  location() {
    return this._value.location;
  }
}

export class SqRuntimeError extends SqAbstractError<"runtime"> {
  tag = "runtime" as const;

  constructor(private _value: IRuntimeError) {
    super();
  }

  toString() {
    return this._value.toString();
  }

  toStringWithDetails() {
    return this._value.toString({
      withStackTrace: true,
      // TODO - reimplement the support for source maps with the new SqProject
      // resolveSource: project ? (id) => project.getSource(id) : undefined,
    });
  }

  getFrameArray(): SqFrame[] {
    const frames = this._value.getFrameArray();
    return frames.map((frame) => new SqFrame(frame));
  }

  location(): LocationRange | undefined {
    return this._value.stackTrace.getTopLocation();
  }
}

export class SqCompileError extends SqAbstractError<"compile"> {
  tag = "compile" as const;

  constructor(public _value: ICompileError) {
    super();
  }

  toString() {
    return this._value.toString();
  }

  toStringWithDetails() {
    return this._value.toStringWithDetails();
  }

  location() {
    return this._value.location;
  }
}

export class SqImportError extends SqAbstractError<"import"> {
  tag = "import" as const;

  constructor(
    private _value: SqError,
    private _imp: Import
  ) {
    super();
  }

  wrappedError() {
    let error: SqError = this._value;
    while (error.tag === "import") {
      error = error._value;
    }
    return error;
  }

  // Similar to runtime error; frames are for imports, so it's not the same as
  // the stack trace, but it's the closest thing we have.
  getFrameArray(): SqFrame[] {
    const frames: SqFrame[] = [];

    let error: SqError = this;

    while (error.tag === "import") {
      frames.push(
        new SqFrame(new StackTraceFrame(error._imp.name, error._imp.location))
      );
      error = error._value;
    }
    frames.reverse();

    return frames;
  }

  location() {
    return this._imp.location;
  }

  toString(): string {
    return this._value.toString();
  }

  toStringWithDetails() {
    let error: SqError = this;
    const imports: Import[] = [];

    while (error.tag === "import") {
      imports.push(error._imp);
      error = error._value;
    }

    imports.reverse();

    return (
      error.toStringWithDetails() +
      "\nImport chain:\n" +
      imports
        .map(
          (imp) =>
            `  import ${imp.name} at line ${imp.location.start.line}, column ${imp.location.start.column}, file ${imp.location.source}`
        )
        .join("\n")
    );
  }
}

export class SqOtherError extends SqAbstractError<"other"> {
  tag = "other" as const;

  constructor(private _value: string) {
    super();
  }

  toString() {
    return this._value;
  }

  toStringWithDetails() {
    // no details on other errors
    return this._value;
  }
}

export type SqError =
  | SqRuntimeError
  | SqCompileError
  | SqImportError
  | SqOtherError;

export class SqErrorList {
  constructor(private _value: SqError[]) {
    if (_value.length === 0) {
      throw new Error("SqErrorList must have at least one error");
    }
  }

  get errors() {
    return this._value;
  }

  toString() {
    return this._value.map((err) => err.toString()).join("\n");
  }

  toStringWithDetails() {
    return this._value.map((err) => err.toStringWithDetails()).join("\n");
  }
}
