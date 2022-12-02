import { LocationRange } from "peggy";
import { Expression } from "../expression";
import { ReducerFn, Value } from "../value";
import { Bindings, NamespaceMap } from "./bindings";
import * as Context from "./Context";
import { ReducerContext } from "./Context";
import * as FrameStack from "./FrameStack";
import * as SqError from "./IError";

type LambdaBody = (
  args: Value[],
  context: ReducerContext,
  reducerFn: ReducerFn
) => Value;

export type Lambda = Readonly<
  | {
      type: "Lambda";
      parameters: string[];
      body: LambdaBody;
      location: LocationRange;
      name?: string;
    }
  | {
      type: "Builtin";
      body: LambdaBody;
      name: string;
    }
>;

export const getName = (t: Lambda): string => {
  return t.name ?? "<anonymous>";
};

// user-defined functions, i.e. `add2 = {|x, y| x + y}`, are built by this method
export const makeLambda = (
  name: string | undefined,
  parameters: string[],
  bindings: Bindings,
  body: Expression,
  location: LocationRange
): Lambda => {
  const lambda = (
    args: Value[],
    context: ReducerContext,
    reducer: ReducerFn
  ) => {
    const argsLength = args.length;
    const parametersLength = parameters.length;
    if (argsLength !== parametersLength) {
      SqError.Message.throw(
        SqError.REArityError(undefined, parametersLength, argsLength)
      );
    }

    // create new bindings scope
    const localBindings = bindings.extendWith(
      NamespaceMap(parameters.map((parameter, i) => [parameter, args[i]]))
    );

    const lambdaContext: ReducerContext = {
      bindings: localBindings, // based on bindings at the moment of lambda creation
      environment: context.environment, // environment at the moment when lambda is called
      frameStack: context.frameStack, // already extended in `doLambdaCall`
      inFunction: context.inFunction, // already updated in `doLambdaCall`
    };

    const [value] = reducer(body, lambdaContext);
    return value;
  };

  return {
    type: "Lambda",
    // context: bindings,
    name,
    body: lambda,
    parameters,
    location,
  };
};

// stdlib functions (everything in FunctionRegistry) are built by this method. Body is generated in SquiggleLibrary_StdLib.res
export const makeFFILambda = (name: string, body: LambdaBody): Lambda => ({
  type: "Builtin",
  // Note: current bindings could be accidentally exposed here through context (compare with native lambda implementation above, where we override them with local bindings).
  // But FunctionRegistry API is too limited for that to matter. Please take care not to violate that in the future by accident.
  body,
  name,
});

// this function doesn't scale to FunctionRegistry's polymorphic functions
export const parameters = (t: Lambda): string[] => {
  if (t.type === "Lambda") {
    return t.parameters;
  } else {
    return ["..."];
  }
};

export const doLambdaCallFrom = (
  t: Lambda,
  args: Value[],
  context: ReducerContext,
  reducer: ReducerFn,
  location: LocationRange | undefined
): Value => {
  const newContext: ReducerContext = {
    ...context,
    frameStack: FrameStack.extend(
      context.frameStack,
      Context.currentFunctionName(context),
      location
    ),
    inFunction: t,
  };

  return SqError.rethrowWithFrameStack(() => {
    return t.body(args, newContext, reducer);
  }, newContext.frameStack);
};

export const doLambdaCall = (
  t: Lambda,
  args: Value[],
  context: ReducerContext,
  reducer: ReducerFn
) => {
  return doLambdaCallFrom(t, args, context, reducer, undefined);
};
