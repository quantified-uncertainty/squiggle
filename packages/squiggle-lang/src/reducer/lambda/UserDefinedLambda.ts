import { AnyExpressionIR } from "../../compiler/types.js";
import {
  REArgumentDomainError,
  REArityError,
  REDomainError,
} from "../../errors/messages.js";
import { Value } from "../../value/index.js";
import { Reducer } from "../Reducer.js";
import { FnSignature } from "./FnSignature.js";
import { BaseLambda } from "./index.js";

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.

export class UserDefinedLambda extends BaseLambda {
  readonly type = "UserDefinedLambda";
  signature: FnSignature;
  name?: string;
  body: AnyExpressionIR;

  constructor(
    name: string | undefined,
    captures: Value[],
    signature: FnSignature,
    body: AnyExpressionIR
  ) {
    super();
    this.name = name;
    this.captures = captures;
    this.body = body;
    this.signature = signature;
  }

  callBody(args: Value[], reducer: Reducer) {
    const validatedArgs = this.signature.validateArgs(args);
    if (!validatedArgs.ok) {
      const err = validatedArgs.value;
      if (err.kind === "arity") {
        throw new REArityError(
          this.display(),
          this.signature.inputs.length,
          args.length
        );
      } else if (err.kind === "domain") {
        // Attach the position of an invalid parameter.  Later, in the
        // Reducer, this error will be upgraded once more with the proper AST,
        // based on the position.
        throw err.err instanceof REDomainError
          ? new REArgumentDomainError(err.position, err.err)
          : err;
      } else {
        throw err satisfies never;
      }
    }

    for (const arg of validatedArgs.value) {
      reducer.stack.push(arg);
    }

    return reducer.evaluateExpression(this.body);
  }

  display() {
    return this.name || "<anonymous>";
  }

  toString() {
    return `(${this.getParameterNames().join(",")}) => internal code`;
  }

  override signatures(): FnSignature[] {
    return [this.signature];
  }

  getParameterNames() {
    return this.signature.inputs.map((input) => input.name);
  }

  parameterString() {
    return this.getParameterNames().join(",");
  }

  override inferOutputType() {
    return this.signature.output;
  }
}
