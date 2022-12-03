import { LocationRange } from "peggy";
import { Expression } from "../expression";
import { ReducerFn, Value } from "../value";
import { Bindings } from "./bindings";
import * as Context from "./Context";
import { ReducerContext } from "./Context";
import { ErrorMessage, REArityError } from "./ErrorMessage";
import * as SqError from "./IError";

type LambdaBody = (
  args: Value[],
  context: ReducerContext,
  reducerFn: ReducerFn
) => Value;

export abstract class Lambda {
  constructor(public body: LambdaBody) {}

  abstract getName(): string;
  abstract getParameters(): string[];
  abstract toString(): string;

  callFrom(
    args: Value[],
    context: ReducerContext,
    reducer: ReducerFn,
    location: LocationRange | undefined
  ): Value {
    const newContext: ReducerContext = {
      ...context,
      frameStack: context.frameStack.extend(
        Context.currentFunctionName(context),
        location
      ),
      inFunction: this,
    };

    return SqError.rethrowWithFrameStack(() => {
      return this.body(args, newContext, reducer);
    }, newContext.frameStack);
  }

  call(args: Value[], context: ReducerContext, reducer: ReducerFn): Value {
    return this.callFrom(args, context, reducer, undefined);
  }
}

// user-defined functions, i.e. `add2 = {|x, y| x + y}`, are instances of this class
export class SquiggleLambda extends Lambda {
  parameters: string[];
  location: LocationRange;
  name?: string;

  constructor(
    name: string | undefined,
    parameters: string[],
    bindings: Bindings,
    body: Expression,
    location: LocationRange
  ) {
    // creating inline functions is bad for performance; this should be refactored as a method
    const lambda = (
      args: Value[],
      context: ReducerContext,
      reducer: ReducerFn
    ) => {
      const argsLength = args.length;
      const parametersLength = parameters.length;
      if (argsLength !== parametersLength) {
        ErrorMessage.throw(
          REArityError(undefined, parametersLength, argsLength)
        );
      }

      // We could call bindings.extend() here to create a new local scope, but we don't,
      // since bindings are immutable anyway, and scopes are costly (lookups to upper scopes are O(depth)).
      let localBindings = bindings;
      for (let i = 0; i < parametersLength; i++) {
        localBindings = localBindings.set(parameters[i], args[i]);
      }

      const lambdaContext: ReducerContext = {
        bindings: localBindings, // based on bindings at the moment of lambda creation
        environment: context.environment, // environment at the moment when lambda is called
        frameStack: context.frameStack, // already extended in `.call()`
        inFunction: context.inFunction, // already updated in `.call()`
      };

      const [value] = reducer(body, lambdaContext);
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

// stdlib functions (everything in FunctionRegistry) are instances of this class. Body is generated in library.ts makeStdlib() function.
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
