import maxBy from "lodash/maxBy.js";
import uniq from "lodash/uniq.js";
import { LocationRange } from "peggy";

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
import { Interpreter } from "./Interpreter.js";

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
  abstract defaultInputs(): Input[];
  abstract toCalculator(): Calculator;

  protected abstract body(args: Value[], context: Interpreter): Value;
}

// User-defined functions, e.g. `add2 = {|x, y| x + y}`, are instances of this class.
export class UserDefinedLambda extends BaseLambda {
  readonly type = "UserDefinedLambda";
  parameters: UserDefinedLambdaParameter[];
  location: LocationRange;
  name?: string;
  private expression: Expression;

  constructor(
    name: string | undefined,
    captures: Value[],
    parameters: UserDefinedLambdaParameter[],
    expression: Expression,
    location: LocationRange
  ) {
    super();
    this.expression = expression;
    this.captures = captures;
    this.name = name;
    this.parameters = parameters;
    this.location = location;
  }

  body(args: Value[], context: Interpreter) {
    const argsLength = args.length;
    const parametersLength = this.parameters.length;
    if (argsLength !== parametersLength) {
      throw new REArityError(this.display(), parametersLength, argsLength);
    }

    for (let i = 0; i < parametersLength; i++) {
      const parameter = this.parameters[i];
      context.stack.push(args[i]);
      if (parameter.domain) {
        parameter.domain.value.validateValue(args[i]);
      }
    }

    return context.evaluate(this.expression);
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
    super();
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

  body(args: Value[], context: Interpreter): Value {
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
