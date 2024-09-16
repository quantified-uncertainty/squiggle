import { LocationRange } from "../ast/types.js";
import {
  SerializedStackTrace,
  StackTrace,
  StackTraceFrame,
} from "../reducer/StackTrace.js";
import { ErrorMessage } from "./messages.js";

function snippetByLocation(
  location: LocationRange,
  resolveSource: (sourceId: string) => string | undefined
) {
  const source = resolveSource(location.source);
  if (!source) {
    return "";
  }
  // 1-based numbers
  const firstLineNumber = location.start.line;
  const lastLineNumber = location.end.line;

  const header = `--> ${location.source}:${firstLineNumber}:${location.start.column}`;
  const gutterWidth = String(lastLineNumber).length + 1;
  const emptyGutter = " ".repeat(gutterWidth);

  const allLines = source.split("\n");
  let snippet = "";
  for (
    let lineNumber = firstLineNumber;
    lineNumber <= lastLineNumber;
    lineNumber++
  ) {
    if (snippet) snippet += "\n";
    snippet += `${lineNumber} | ${allLines[lineNumber - 1]}`;
  }

  const singleLine = firstLineNumber === lastLineNumber;

  const topMarker = singleLine
    ? ""
    : " ".repeat(location.start.column - 1) +
      "v" +
      "~".repeat(allLines[firstLineNumber - 1].length - location.start.column);

  const bottomMarker = singleLine
    ? `${" ".repeat(location.start.column - 1)}${"_".repeat(location.end.column - location.start.column)}`
    : "~".repeat(location.end.column - 2) + "^";

  return `${header}
${emptyGutter}| ${topMarker}
${snippet}
${emptyGutter}| ${bottomMarker}
`;
}

// "I" stands for "Internal", since we also have a more public SqError proxy
export class IRuntimeError extends Error {
  readonly type = "IRuntimeError";

  // TODO - it would be better to store `m` in `cause`, to like native Error objects do.
  private constructor(
    public m: ErrorMessage,
    public stackTrace: StackTrace
  ) {
    // Should we pass `m.toString()`?
    // It'd be a bit costly and we override `IError.toString()` anyway.
    super();
  }

  static fromMessage(
    message: ErrorMessage,
    stackTrace: StackTrace
  ): IRuntimeError {
    return new IRuntimeError(message, stackTrace);
  }

  static fromException(err: unknown, stackTrace: StackTrace): IRuntimeError {
    if (err instanceof IRuntimeError) {
      return err;
    } else if (err instanceof ErrorMessage) {
      // probably comes from FunctionRegistry, adding stacktrace
      return IRuntimeError.fromMessage(err, stackTrace);
    } else if (err instanceof Error) {
      return IRuntimeError.fromMessage(
        ErrorMessage.javascriptError(err.message, err.name),
        stackTrace
      );
    } else {
      return IRuntimeError.fromMessage(
        ErrorMessage.otherError("Unknown exception"),
        stackTrace
      );
    }
  }

  override toString({
    withStackTrace = false,
    resolveSource,
  }: {
    withStackTrace?: boolean;
    resolveSource?: (sourceId: string) => string | undefined;
  } = {}) {
    let result = this.m.toString();

    if (!withStackTrace) {
      return result;
    }

    if (resolveSource) {
      const location = this.stackTrace.getTopLocation();
      if (location) {
        const snippet = snippetByLocation(location, resolveSource);
        if (snippet) {
          result += "\n\n" + snippet;
        }
      }
    }

    return (
      result +
      (this.stackTrace.isEmpty()
        ? ""
        : "\nStack trace:\n" + this.stackTrace.toString())
    );
  }

  getFrameArray(): StackTraceFrame[] {
    return this.stackTrace.frames;
  }

  serialize(): SerializedIRuntimeError {
    return {
      type: "IRuntimeError",
      message: this.m.serialize(),
      stackTrace: this.stackTrace.serialize(),
    };
  }

  static deserialize(data: SerializedIRuntimeError): IRuntimeError {
    return new IRuntimeError(
      ErrorMessage.deserialize(data.message),
      StackTrace.deserialize(data.stackTrace)
    );
  }
}

type SerializedIRuntimeError = {
  type: "IRuntimeError";
  message: ReturnType<ErrorMessage["serialize"]>;
  stackTrace: SerializedStackTrace;
};

export class ICompileError extends Error {
  readonly type = "ICompileError";

  constructor(
    public override message: string,
    public location: LocationRange
  ) {
    super();
  }

  override toString({
    withLocation,
    resolveSource,
  }: {
    withLocation?: boolean;
    // if set, snippet will be included in the output
    resolveSource?: (sourceId: string) => string | undefined;
  } = {}) {
    let result = this.message;

    if (resolveSource) {
      const snippet = snippetByLocation(this.location, resolveSource);
      if (snippet) {
        result += "\n\n" + snippet;
      }
    }

    if (withLocation) {
      result += `\nLocation:\n  at line ${this.location.start.line}, column ${this.location.start.column}, file ${this.location.source}`;
    }
    return result;
  }

  // legacy method
  toStringWithDetails() {
    return this.toString({ withLocation: true });
  }

  serialize(): SerializedICompileError {
    return {
      type: this.type,
      message: this.message,
      location: this.location,
    };
  }
}

export type IError = ICompileError | IRuntimeError;

type SerializedICompileError = {
  type: "ICompileError";
  message: string;
  location: LocationRange;
};

export type SerializedIError =
  | SerializedICompileError
  | SerializedIRuntimeError;

export function serializeIError(value: IError): SerializedIError {
  return value.serialize();
}

export function deserializeIError(value: SerializedIError): IError {
  switch (value.type) {
    case "ICompileError":
      return new ICompileError(value.message, value.location);
    case "IRuntimeError":
      return IRuntimeError.deserialize(value);
    default:
      throw new Error(`Unknown value ${value} satisfies never`);
  }
}
