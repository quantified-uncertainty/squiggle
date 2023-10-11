import { LocationRange } from "peggy";

import { ASTNode } from "../ast/parse.js";
import * as IError from "../errors/IError.js";
import { REArityError, REDomainError, REOther } from "../errors/messages.js";
import { Expression } from "../expression/index.js";
import { VDomain, Value } from "../value/index.js";
import * as Context from "./context.js";
import { ReducerContext } from "./context.js";
import { Stack } from "./stack.js";
import {
  FnDefinition,
  fnDefinitionToString,
  tryCallFnDefinition,
} from "../library/registry/fnDefinition.js";
import uniq from "lodash/uniq.js";
import { sort } from "../utility/E_A_Floats.js";
import { FRType } from "../library/registry/frTypes.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

export abstract class Lambda {
  constructor(public body: LambdaBody) {}

  abstract type: string;
  abstract getName(): string;
  abstract toString(): string;
  abstract parameterString(): string;
  abstract paramCounts(): number[];

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

    try {
      return this.body(args, newContext);
    } catch (e) {
      IError.rethrowWithFrameStack(e, newContext.frameStack);
    }
  }

  call(args: Value[], context: ReducerContext): Value {
    return this.callFrom(args, context, undefined);
  }
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class UserDefinedLambda extends Lambda {
  public parameters: UserDefinedLambdaParameter[];
  location: LocationRange;
  name?: string;
  type = "UserDefinedLambda";

  constructor(
    name: string | undefined,
    parameters: UserDefinedLambdaParameter[],
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
        const parameter = parameters[i];
        localStack = localStack.push(parameter.name, args[i]);
        if (parameter.domain && !parameter.domain.value.includes(args[i])) {
          throw new REDomainError(args[i], parameter.domain);
        }
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

  _getParameterNames() {
    return this.parameters.map((parameter) => parameter.name);
  }

  parameterString() {
    return this._getParameterNames().join(",");
  }

  toString() {
    return `lambda(${this._getParameterNames().join(",")}=>internal code)`;
  }

  paramCounts() {
    return [this.parameters.length];
  }
}

// Stdlib functions (everything in FunctionRegistry) are instances of this class.
export class BuiltinLambda extends Lambda {
  type = "BuiltinLambda";
  _definitions: FnDefinition[];

  constructor(
    public name: string,
    definitions: FnDefinition[]
  ) {
    super((args, context) => this._call(args, context));
    this._definitions = definitions;
  }

  getName() {
    return this.name;
  }

  toString() {
    return this.name;
  }

  parameterString() {
    return this._definitions.map(fnDefinitionToString).join(" | ");
  }

  definitions(): FRType<any>[][] {
    return this._definitions.map((d) => d.inputs);
  }

  _call(args: Value[], context: ReducerContext): Value {
    const definitions = this._definitions;
    const showNameMatchDefinitions = () => {
      const defsString = definitions
        .map(fnDefinitionToString)
        .map((def) => `  ${this.name}${def}\n`)
        .join("");
      return `There are function matches for ${this.name}(), but with different arguments:\n${defsString}`;
    };

    for (const definition of definitions) {
      const callResult = tryCallFnDefinition(definition, args, context);
      if (callResult !== undefined) {
        return callResult;
      }
    }
    throw new REOther(showNameMatchDefinitions());
  }

  paramCounts() {
    return sort(uniq(this._definitions.map((d) => d.inputs.length)));
  }
}
