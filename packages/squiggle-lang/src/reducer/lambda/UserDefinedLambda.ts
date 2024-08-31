import { LocationRange } from "../../ast/types.js";
import { AnyExpressionIR } from "../../compiler/types.js";
import { ErrorMessage } from "../../errors/messages.js";
import { TTypedLambda } from "../../types/TTypedLambda.js";
import { Value } from "../../value/index.js";
import { Frame } from "../FrameStack.js";
import { Reducer } from "../Reducer.js";
import { BaseLambda } from "./index.js";

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.

export class UserDefinedLambda extends BaseLambda {
  readonly type = "UserDefinedLambda";
  signature: TTypedLambda;
  name?: string;
  body: AnyExpressionIR;

  constructor(
    name: string | undefined,
    captures: Value[],
    signature: TTypedLambda,
    body: AnyExpressionIR
  ) {
    super();
    this.name = name;
    this.captures = captures;
    this.body = body;
    this.signature = signature;
  }

  call(args: Value[], reducer: Reducer, location?: LocationRange): Value {
    // validate domains
    const validatedArgs = this.signature.validateArgs(args);
    if (!validatedArgs.ok) {
      const err = validatedArgs.value;
      if (err.kind === "arity") {
        throw ErrorMessage.arityError(
          [this.signature.inputs.length],
          args.length
        );
      } else if (err.kind === "domain") {
        throw new UserDefinedLambdaDomainError(
          err.position,
          ErrorMessage.domainError(
            args[err.position],
            this.signature.inputs[err.position].type
          )
        );
      } else {
        throw err satisfies never;
      }
    }

    // put the lambda on the frame stack and args on the stack, call the lambda
    reducer.frameStack.extend(new Frame(this, location));

    const initialStackSize = reducer.stack.size();

    try {
      for (const arg of validatedArgs.value) {
        reducer.stack.push(arg);
      }
      const callResult = reducer.evaluateExpression(this.body);
      reducer.frameStack.pop();
      return callResult;
    } finally {
      reducer.stack.shrink(initialStackSize);
    }
  }

  display() {
    return this.name || "<anonymous>";
  }

  toString() {
    // TODO - show output type and parameter types?
    return `(${this.getParameterNames().join(",")}) => internal code`;
  }

  signatures(): TTypedLambda[] {
    return [this.signature];
  }

  getParameterNames() {
    return this.signature.inputs.map((input) => input.name);
  }

  parameterString() {
    return this.getParameterNames().join(",");
  }
}

export class UserDefinedLambdaDomainError {
  constructor(
    public idx: number,
    public error: ErrorMessage
  ) {}
}
