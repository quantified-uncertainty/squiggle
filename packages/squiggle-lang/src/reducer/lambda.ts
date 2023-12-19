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
import {
  frAny,
  frDate,
  frNamed,
  frNumber,
  FRType,
  inferFromValue,
} from "../library/registry/frTypes.js";
import { sort } from "../utility/E_A_Floats.js";
import { DateRangeDomain, NumericRangeDomain } from "../value/domain.js";
import {
  Calculator,
  Value,
  vDate,
  VDomain,
  vNumber,
  vString,
} from "../value/index.js";
import * as Context from "./context.js";
import { ReducerContext } from "./context.js";
import { Stack } from "./stack.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
  type?: FRType<any>;
};

const enrichWithDomain = ({
  name,
  domain,
  type,
}: UserDefinedLambdaParameter): UserDefinedLambdaParameter => {
  const nameInputT = (i: FRType<any>) => frNamed(name, i);
  let enrichedType = type;
  if (!type && domain) {
    switch (domain.value.type) {
      case "DateRange":
        enrichedType = nameInputT(frDate);
        break;
      case "NumericRange":
        enrichedType = nameInputT(frNumber);
        break;
    }
  }
  return {
    name,
    domain,
    type: enrichedType,
  };
};

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

function getInferredOutputType(
  lambda: UserDefinedLambda,
  valuesToTry: Value[],
  context: ReducerContext
): FRType<any> | undefined {
  for (const point of valuesToTry) {
    try {
      const testVal = lambda.call([point], context);
      return inferFromValue(testVal);
    } catch (e) {
      // do nothing
    }
  }
  return undefined;
}

type SimpleDef = {
  inputs: FRType<any>[];
  output: FRType<any>;
};

function paramaterToType(
  param: UserDefinedLambdaParameter
): FRType<any> | undefined {
  if (param.domain) {
    return param.domain.value.type === "DateRange" ? frDate : frNumber;
  }
  return undefined;
}

function tryDateInput(
  fn: UserDefinedLambda,
  context: ReducerContext,
  domain: DateRangeDomain
): FRType<any> | undefined {
  const xValuesToTest = [domain.min, domain.max].map(vDate);
  return getInferredOutputType(fn, xValuesToTest, context);
}

function tryNumInput(
  fn: UserDefinedLambda,
  context: ReducerContext,
  domain?: NumericRangeDomain
): FRType<any> | undefined {
  const xDomain = domain ? domain : new NumericRangeDomain(0.1, 10);
  const xValuesToTest = [xDomain.min, xDomain.max].map(vNumber);
  return getInferredOutputType(fn, xValuesToTest, context);
}

function tryStringInput(
  fn: UserDefinedLambda,
  context: ReducerContext
): FRType<any> | undefined {
  return getInferredOutputType(fn, [vString("hi")], context);
}

export function inferUserDef(
  fn: UserDefinedLambda,
  context: ReducerContext
): SimpleDef | undefined {
  if (fn.parameters.length !== 1) {
    return undefined;
  }
  const firstParam = fn.parameters[0];
  const inputType = firstParam.type;
  const { domain, name } = firstParam;
  const nameInputT = (i: FRType<any>) => [frNamed(name, i)];

  // We now assume that whenever we have an inputType, we have a corresponding domain
  if (inputType && !domain) {
    throw new Error(
      "Internal Error: InputType without domain. This should be unreachable."
    );
  }

  if (inputType && domain?.value.type === "DateRange") {
    return {
      inputs: nameInputT(inputType),
      output: tryDateInput(fn, context, domain.value) || frAny(),
    };
  } else if (inputType && domain?.value.type === "NumericRange") {
    return {
      inputs: nameInputT(inputType),
      output: tryNumInput(fn, context, domain.value) || frAny(),
    };
  } else {
    const outputFromNumber = tryNumInput(fn, context);
    const outputFromString = tryStringInput(fn, context);
    if (outputFromNumber && outputFromString) {
      return {
        inputs: nameInputT(frAny()),
        output:
          outputFromNumber === outputFromString ? outputFromNumber : frAny(),
      };
    } else if (outputFromNumber) {
      return {
        inputs: nameInputT(frNumber),
        output: outputFromNumber,
      };
    } else if (outputFromString) {
      return {
        inputs: nameInputT(frNumber),
        output: outputFromString,
      };
    } else {
      return undefined;
    }
  }
}

function enrichParametersAndGetOutputType(
  fn: UserDefinedLambda
): [UserDefinedLambdaParameter[], FRType<any> | undefined] {
  let enrichedParameters = fn.parameters.map(enrichWithDomain); // Add types, using domains
  let outputType = undefined;
  const def = inferUserDef(
    fn,
    Context.createContext({ sampleCount: 10, xyPointLength: 10 })
  );
  if (def && enrichedParameters.length === def.inputs.length) {
    enrichedParameters = enrichedParameters.map((p, i) => ({
      ...p,
      type: def.inputs[i],
    }));
    outputType = def.output;
  }
  return [enrichedParameters, outputType];
}

export abstract class BaseLambda {
  constructor(public body: LambdaBody) {}

  abstract readonly type: string;
  abstract getName(): string;
  abstract toString(): string;
  abstract parameterString(): string;
  abstract parameterCounts(): number[];
  abstract parameterCountString(): string;
  abstract toCalculator(): Calculator;

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
export class UserDefinedLambda extends BaseLambda {
  parameters: UserDefinedLambdaParameter[];
  location: LocationRange;
  name?: string;
  outputType?: FRType<any> | undefined;
  readonly type = "UserDefinedLambda";

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
        if (parameter.domain) {
          parameter.domain.value.validateValue(args[i]);
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
    this.inferAndSaveDefinition();
  }

  private inferAndSaveDefinition() {
    const [parameters, outputType] = enrichParametersAndGetOutputType(this);
    this.parameters = parameters;
    this.outputType = outputType;
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
    return `(${this._getParameterNames().join(",")}) => internal code`;
  }

  parameterCounts() {
    return [this.parameters.length];
  }

  parameterCountString() {
    return this.parameters.length.toString();
  }

  toCalculator(): Calculator {
    const only0Params = this.parameters.length === 0;
    return {
      fn: this,
      inputs: this._getParameterNames().map((name) => ({
        name: name,
        type: "text",
      })),
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
  }

  getName() {
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

  toCalculator(): Calculator {
    const longestSignature = maxBy(this.signatures(), (s) => s.length) || [];
    const autorun = longestSignature.length !== 0;
    return {
      fn: this,
      inputs: longestSignature.map((sig, i) => ({
        name: `Input ${i + 1}`,
        type: sig.getName() === "Bool" ? "checkbox" : "text",
      })),
      autorun,
    };
  }
}

export type Lambda = UserDefinedLambda | BuiltinLambda;
