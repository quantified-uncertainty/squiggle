import { LocationRange } from "peggy";

import { ASTNode } from "../ast/parse.js";
import { REArityError } from "../errors.js";
import { Expression } from "../expression/index.js";
import { Value } from "../value/index.js";
import * as IError from "./IError.js";
import * as Context from "./context.js";
import { ReducerContext } from "./context.js";
import { Stack } from "./stack.js";

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

export abstract class Lambda {
  constructor(public body: LambdaBody) {}

  abstract getName(): string;
  abstract getParameters(): string[];
  abstract toString(): string;

  callFrom(
    args: Value[],
    context: ReducerContext,
    ast: ASTNode | undefined
  ): Value {
    const newContext: ReducerContext = {
      // Be careful! the order here must match the order of props in ReducerContext.
      // Also, we intentionally don't use object spread syntax because of monomorphism.
      stack: context.stack,
      environment: context.environment,
      frameStack: context.frameStack.extend(
        Context.currentFunctionName(context),
        ast?.location
      ),
      evaluate: context.evaluate,
      inFunction: this,
    };

    const value = IError.rethrowWithFrameStack(
      () => this.body(args, newContext),
      newContext.frameStack
    );
    return value;
  }

  call(args: Value[], context: ReducerContext): Value {
    return this.callFrom(args, context, undefined);
  }
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class SquiggleLambda extends Lambda {
  parameters: string[];
  location: LocationRange;
  name?: string;

  constructor(
    name: string | undefined,
    parameters: string[],
    stack: Stack,
    body: Expression,
    location: LocationRange
  ) {
    const lambda: LambdaBody = (args: Value[], context: ReducerContext) => {
      const argsLength = args.length;
      const parametersLength = parameters.length;
      if (argsLength !== parametersLength) {
        throw new REArityError(undefined, parametersLength, argsLength);
      }

      let localStack = stack;
      for (let i = 0; i < parametersLength; i++) {
        localStack = localStack.push(parameters[i], args[i]);
      }

      const lambdaContext: ReducerContext = {
        stack: localStack,
        // no spread is intentional - helps with monomorphism
        environment: context.environment,
        frameStack: context.frameStack,
        evaluate: context.evaluate,
        inFunction: context.inFunction,
      };

      const [value] = context.evaluate(body, lambdaContext);
      return value;
    };

    super(lambda);
    this.name = name;
    this.parameters = parameters;
    this.location = location;
  }

  getName() {
    return this.name || "<anonymous>";
  }

  getParameters() {
    return this.parameters;
  }

  toString() {
    return `lambda(${this.parameters.join(",")}=>internal code)`;
  }
}

// Stdlib functions (everything in FunctionRegistry) are instances of this class.
export class BuiltinLambda extends Lambda {
  constructor(public name: string, body: LambdaBody) {
    super(body);
  }

  getName() {
    return this.name;
  }

  // this function doesn't scale to FunctionRegistry's polymorphic functions
  getParameters() {
    return ["..."];
  }

  toString() {
    return "Builtin function"; // TODO - return name instead?
  }
}
