import { AnyTypedExpressionNode } from "../analysis/types.js";
import { DistError, distErrorToString } from "../dists/DistError.js";
import { OperationError } from "../operationError.js";
import { BuiltinLambda } from "../reducer/lambda/BuiltinLambda.js";
import { TDict } from "../types/TDict.js";
import { Type } from "../types/Type.js";
import { Value } from "../value/index.js";

// Messages don't contain any stack trace information.
// Stdlib functions are allowed to throw messages, because they will be caught later
// and wrapped in `IRuntimeError.fromException` with the correct stacktrace.
export class ErrorMessage extends Error {
  private constructor(message: string) {
    super(message);
  }

  override toString() {
    return this.message;
  }

  serialize() {
    return this.message;
  }

  static deserialize(msg: string) {
    return new ErrorMessage(msg);
  }

  static arityError(
    arity: number[], // possible arities
    usedArity: number // actual arity, shouldn't be in `this.arity`
  ) {
    const minArity = Math.min(...arity);
    const maxArity = Math.max(...arity);
    const arityMessage =
      minArity === maxArity ? `${minArity}` : `${minArity}-${maxArity}`;

    return new ErrorMessage(
      `${arityMessage} arguments expected. Instead ${usedArity} argument(s) were passed.`
    );
  }

  static arrayIndexNotFoundError(msg: string, index: number) {
    return new ErrorMessage(`${msg}: ${index}`);
  }

  static distributionError(err: DistError) {
    return new ErrorMessage(
      `Distribution Math Error: ${distErrorToString(err)}`
    );
  }

  static expectedTypeError(typeName: string, valueString: string) {
    return new ErrorMessage(
      `Expected type: ${typeName} but got: ${valueString}`
    );
  }

  static typeIsNotAFunctionError(type: Type) {
    return new ErrorMessage(`${type.toString()} is not a function`);
  }

  static valueIsNotAFunctionError(value: Value) {
    return new ErrorMessage(`${value.valueToString()} is not a function`);
  }

  static valueIsNotADecoratorError(value: Value) {
    return new ErrorMessage(`${value.valueToString()} is not a decorator`);
  }

  // used both in compile time and runtime, see below
  private static builtinLambdaSignatureMismatchError(
    fn: BuiltinLambda,
    args: string[]
  ) {
    const defsString = fn.definitions
      .filter((d) => d.showInDocumentation())
      .map((def) => `  ${fn.name}${def}\n`)
      .join("");

    return new ErrorMessage(
      `Error: There are function matches for ${fn.name}(), but with different arguments:\n${defsString}Was given arguments: (${args.join(
        ","
      )})`
    );
  }

  static callSignatureMismatchError(
    fn: AnyTypedExpressionNode,
    args: Type[]
  ): ErrorMessage {
    if (
      fn.kind === "Identifier" &&
      fn.resolved.kind === "builtin" &&
      fn.resolved.value.type === "Lambda" &&
      fn.resolved.value.value instanceof BuiltinLambda
    ) {
      return ErrorMessage.builtinLambdaSignatureMismatchError(
        fn.resolved.value.value,
        args.map((arg) => arg.toString())
      );
    }

    return new ErrorMessage(
      `Function does not support types (${args.map((arg) => arg.toString()).join(", ")})`
    );
  }

  static runtimeCallSignatureMismatchError(
    fn: BuiltinLambda,
    args: Value[]
  ): ErrorMessage {
    return ErrorMessage.builtinLambdaSignatureMismatchError(
      fn,
      args.map((arg) => arg.valueToString())
    );
  }

  static operationError(err: OperationError) {
    return new ErrorMessage(`Math Error: ${err.toString()}`);
  }

  static dictPropertyNotFoundError(key: string) {
    return new ErrorMessage(`Dict property not found: ${key}`);
  }

  static dictPropertyNotFoundCompileError(key: string, dictType: TDict<any>) {
    return new ErrorMessage(
      `Property ${key} doesn't exist in dict ${dictType}`
    );
  }

  static todoError(msg: string) {
    return new ErrorMessage(`TODO: ${msg}`);
  }

  static domainError(value: Value, domain: Type) {
    return new ErrorMessage(
      `Domain Error: Parameter ${value.valueToString()} must be in domain ${domain}`
    );
  }

  // Wrapped JavaScript exception. See IError class for details.
  static javascriptError(msg: string, name: string) {
    let fullMsg = `JS Exception: ${name}`;
    if (msg) fullMsg += `: ${msg}`;
    return new ErrorMessage(fullMsg);
  }

  static argumentError(msg: string) {
    return new ErrorMessage(`Argument Error: ${msg}`);
  }

  static otherError(msg: string) {
    return new ErrorMessage(`Error: ${msg}`);
  }

  static ambiguousError(msg: string) {
    return new ErrorMessage(`Ambiguous Error: ${msg}`);
  }

  // Used for user-created throw() function calls
  static userThrowError(msg: string) {
    return new ErrorMessage(msg);
  }
}
