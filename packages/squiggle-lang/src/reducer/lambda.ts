import maxBy from "lodash/maxBy.js";
import uniq from "lodash/uniq.js";
import { LocationRange } from "peggy";

import { ASTNode } from "../ast/parse.js";
import * as IError from "../errors/IError.js";
import { REArityError, REOther } from "../errors/messages.js";
import { Expression } from "../expression/index.js";
import {
  FnDefinition,
  fnDefinitionToString,
  showInDocumentation,
  tryCallFnDefinition,
} from "../library/registry/fnDefinition.js";
import { FRType } from "../library/registry/frTypes.js";
import { frTypeToInput } from "../library/registry/helpers.js";
import { sort } from "../utility/E_A_Floats.js";
import { Value } from "../value/index.js";
import { Calculator } from "../value/VCalculator.js";
import { VDomain } from "../value/VDomain.js";
import { Input } from "../value/VInput.js";
import { ReducerContext } from "./context.js";
import { Frame } from "./frameStack.js";
import { StackTrace } from "./stackTrace.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

export abstract class BaseLambda {
  isDecorator: boolean = false;

  constructor(public body: LambdaBody) {}

  abstract readonly type: string;
  abstract display(): string;
  abstract toString(): string;
  abstract parameterString(): string;
  abstract parameterCounts(): number[];
  abstract parameterCountString(): string;
  abstract defaultInputs(): Input[];
  abstract toCalculator(): Calculator;

  callFrom(
    args: Value[],
    context: ReducerContext,
    ast: ASTNode | undefined
  ): Value {
    const initialStackSize = context.stack.size();
    const initialCaptures = context.captures;

    context.captures = [];
    context.frameStack.extend(new Frame(this.display(), ast?.location));

    try {
      const result = this.body(args, context);
      context.frameStack.pop();
      return result;
    } catch (e) {
      IError.rethrowWithFrameStack(
        e,
        new StackTrace(context.frameStack, ast?.location)
      );
    } finally {
      context.stack.shrink(initialStackSize);
      context.captures = initialCaptures;
    }
  }

  call(args: Value[], context: ReducerContext): Value {
    return this.callFrom(args, context, undefined);
  }
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class UserDefinedLambda extends BaseLambda {
  parameters: UserDefinedLambdaParameter[];
  location: LocationRange;
  name?: string;
  readonly type = "UserDefinedLambda";

  constructor(
    name: string | undefined,
    captures: Value[],
    parameters: UserDefinedLambdaParameter[],
    body: Expression,
    location: LocationRange
  ) {
    const lambda: LambdaBody = (args: Value[], context: ReducerContext) => {
      const argsLength = args.length;
      const parametersLength = parameters.length;
      if (argsLength !== parametersLength) {
        throw new REArityError(undefined, parametersLength, argsLength);
      }

      for (let i = 0; i < parametersLength; i++) {
        const parameter = parameters[i];
        context.stack.push(args[i]);
        if (parameter.domain) {
          parameter.domain.value.validateValue(args[i]);
        }
      }

      context.captures = captures;

      return context.evaluate(body, context);
    };

    super(lambda);
    this.name = name;
    this.parameters = parameters;
    this.location = location;
  }

  display() {
    return this.name || "<anonymous>";
  }

  _getParameterNames() {
    return this.parameters.map((parameter) => parameter.name);
  }

  parameterString() {
    return this._getParameterNames().join(",");
  }

  toString() {
    return `(${this._getParameterNames().join(",")}) => internal code`;
  }

  parameterCounts() {
    return [this.parameters.length];
  }

  parameterCountString() {
    return this.parameters.length.toString();
  }

  defaultInputs(): Input[] {
    return this._getParameterNames().map((name) => ({
      name,
      type: "text",
    }));
  }

  toCalculator(): Calculator {
    const only0Params = this.parameters.length === 0;
    return {
      fn: this,
      inputs: this.defaultInputs(),
      autorun: only0Params,
    };
  }
}

// Stdlib functions (everything in FunctionRegistry) are instances of this class.
export class BuiltinLambda extends BaseLambda {
  readonly type = "BuiltinLambda";
  _definitions: FnDefinition[];

  constructor(
    public name: string,
    signatures: FnDefinition[]
  ) {
    super((args, context) => this._call(args, context));
    this._definitions = signatures;

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
    return this._definitions
      .filter(showInDocumentation)
      .map(fnDefinitionToString)
      .join(" | ");
  }

  parameterCounts() {
    return sort(uniq(this._definitions.map((d) => d.inputs.length)));
  }

  parameterCountString() {
    return `[${this.parameterCounts().join(",")}]`;
  }

  signatures(): FRType<unknown>[][] {
    return this._definitions.map((d) => d.inputs);
  }

  _call(args: Value[], context: ReducerContext): Value {
    const signatures = this._definitions;
    const showNameMatchDefinitions = () => {
      const defsString = signatures
        .filter(showInDocumentation)
        .map(fnDefinitionToString)
        .map((def) => `  ${this.name}${def}\n`)
        .join("");
      return `There are function matches for ${
        this.name
      }(), but with different arguments:\n${defsString}Was given arguments: (${args.join(
        ","
      )})`;
    };

    for (const signature of signatures) {
      const callResult = tryCallFnDefinition(signature, args, context);
      if (callResult !== undefined) {
        return callResult;
      }
    }
    throw new REOther(showNameMatchDefinitions());
  }

  override defaultInputs(): Input[] {
    const longestSignature = maxBy(this.signatures(), (s) => s.length) || [];
    return longestSignature.map((sig, i) => {
      const name = sig.varName ? sig.varName : `Input ${i + 1}`;
      return frTypeToInput(sig, i, name);
    });
  }

  toCalculator(): Calculator {
    const inputs = this.defaultInputs();
    return {
      fn: this,
      inputs: inputs,
      autorun: inputs.length !== 0,
    };
  }
}

export type Lambda = UserDefinedLambda | BuiltinLambda;
