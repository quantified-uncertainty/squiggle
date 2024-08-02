import uniq from "lodash/uniq.js";

import { LocationRange } from "../ast/types.js";
import { AnyExpressionIR } from "../compiler/types.js";
import {
  REArgumentDomainError,
  REArityError,
  REDomainError,
  REOther,
} from "../errors/messages.js";
import { FnDefinition } from "../library/registry/fnDefinition.js";
import { FnInput } from "../library/registry/fnInput.js";
import { Type } from "../types/Type.js";
import { sort } from "../utility/E_A_Floats.js";
import { Value } from "../value/index.js";
import { VDomain } from "../value/VDomain.js";
import { Frame } from "./FrameStack.js";
import { Reducer } from "./Reducer.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

export abstract class BaseLambda {
  isDecorator: boolean = false;
  captures: Value[] = []; // used only on user-defined lambdas, but useful for all lambdas for faster lookups

  abstract readonly type: string;
  abstract display(): string;
  abstract toString(): string;
  abstract parameterString(): string;
  abstract parameterCounts(): number[];
  abstract parameterCountString(): string;

  protected abstract callBody(args: Value[], reducer: Reducer): Value;

  // Prepare a new frame and call the lambda's body with given args.
  call(args: Value[], reducer: Reducer, location?: LocationRange) {
    const initialStackSize = reducer.stack.size();

    reducer.frameStack.extend(new Frame(this, location));

    try {
      const result = this.callBody(args, reducer);
      // If lambda throws an exception, this won't happen.  This is intentional;
      // it allows us to build the correct stacktrace with `.errorFromException`
      // method later.
      reducer.frameStack.pop();
      return result;
    } finally {
      reducer.stack.shrink(initialStackSize);
    }
  }
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class UserDefinedLambda extends BaseLambda {
  readonly type = "UserDefinedLambda";
  parameters: UserDefinedLambdaParameter[];
  name?: string;
  body: AnyExpressionIR;

  constructor(
    name: string | undefined,
    captures: Value[],
    parameters: UserDefinedLambdaParameter[],
    body: AnyExpressionIR
  ) {
    super();
    this.name = name;
    this.captures = captures;
    this.body = body;
    this.parameters = parameters;
  }

  callBody(args: Value[], reducer: Reducer) {
    const argsLength = args.length;
    const parametersLength = this.parameters.length;
    if (argsLength !== parametersLength) {
      throw new REArityError(this.display(), parametersLength, argsLength);
    }

    for (let i = 0; i < parametersLength; i++) {
      const parameter = this.parameters[i];
      if (parameter.domain) {
        try {
          parameter.domain.value.validateValue(args[i]);
        } catch (e) {
          // Attach the position of an invalid parameter.  Later, in the
          // Reducer, this error will be upgraded once more with the proper AST,
          // based on the position.
          throw e instanceof REDomainError
            ? new REArgumentDomainError(i, e)
            : e;
        }
      }
      reducer.stack.push(args[i]);
    }

    return reducer.evaluateExpression(this.body);
  }

  display() {
    return this.name || "<anonymous>";
  }

  getParameterNames() {
    return this.parameters.map((parameter) => parameter.name);
  }

  parameterString() {
    return this.getParameterNames().join(",");
  }

  toString() {
    return `(${this.getParameterNames().join(",")}) => internal code`;
  }

  parameterCounts() {
    return [this.parameters.length];
  }

  parameterCountString() {
    return this.parameters.length.toString();
  }
}

// Stdlib functions (everything in FunctionRegistry) are instances of this class.
export class BuiltinLambda extends BaseLambda {
  readonly type = "BuiltinLambda";
  private definitions: FnDefinition[];

  constructor(
    public name: string,
    signatures: FnDefinition[]
  ) {
    super();
    this.definitions = signatures;

    // TODO - this sets the flag that the function is a decorator, but later we don't check which signatures are decorators.
    // For now, it doesn't matter because we don't allow user-defined decorators, and `Tag.*` decorators work as decorators on all possible definitions.
    this.isDecorator = signatures.some((s) => s.isDecorator);
  }

  display() {
    return this.name;
  }

  toString() {
    return this.name;
  }

  parameterString() {
    return this.definitions
      .filter((d) => d.showInDocumentation())
      .map((d) => d.toString())
      .join(" | ");
  }

  parameterCounts() {
    return sort(uniq(this.definitions.map((d) => d.inputs.length)));
  }

  parameterCountString() {
    return `[${this.parameterCounts().join(",")}]`;
  }

  signatures(): FnInput<Type<unknown>>[][] {
    return this.definitions.map((d) => d.inputs);
  }

  callBody(args: Value[], reducer: Reducer): Value {
    for (const definition of this.definitions) {
      const callResult = definition.tryCall(args, reducer);
      if (callResult !== undefined) {
        return callResult;
      }
    }

    const showNameMatchDefinitions = () => {
      const defsString = this.definitions
        .filter((d) => d.showInDocumentation())
        .map((d) => d.toString())
        .map((def) => `  ${this.name}${def}\n`)
        .join("");
      return `There are function matches for ${
        this.name
      }(), but with different arguments:\n${defsString}Was given arguments: (${args.join(
        ","
      )})`;
    };

    throw new REOther(showNameMatchDefinitions());
  }
}

export type Lambda = UserDefinedLambda | BuiltinLambda;
