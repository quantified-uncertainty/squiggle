import { LocationRange } from "peggy";

import { ASTNode } from "../ast/parse.js";
import * as IError from "../errors/IError.js";
import { REArityError, REOther } from "../errors/messages.js";
import { Expression } from "../expression/index.js";
import {
  Calculator,
  VDomain,
  Value,
  vDomain,
  vNumber,
  vString,
} from "../value/index.js";
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
import maxBy from "lodash/maxBy.js";
import { Domain, NumericRangeDomain } from "../value/domain.js";
import { SDate } from "../index.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

type LambdaBody = (args: Value[], context: ReducerContext) => Value;

type sig = {
  name: string;
  domain?: Domain;
  typeName?: string;
  fnType: "UserDefinedLambda" | "BuiltinLambda";
};

export function lambdaToLambdaSignatures(lambda: Lambda): sig[][] {
  switch (lambda.type) {
    case "UserDefinedLambda":
      return [
        lambda.parameters.map((param) => {
          return {
            name: param.name,
            domain: param.domain ? param.domain.value : undefined,
            fnType: "UserDefinedLambda",
          };
        }),
      ];
    case "BuiltinLambda":
      return lambda.signatures().map((def) =>
        def.map((p, index) => ({
          name: index.toString(),
          domain: undefined,
          typeName: p.getName(),
          fnType: "BuiltinLambda",
        }))
      );
  }
}

function getInferredType(lambda: Lambda, pointsToTry: Value[], context: any) {
  for (const point of pointsToTry) {
    const testVal = lambda.call([point], context);
    if (testVal.type === "Number" || testVal.type === "Dist") {
      return testVal.type;
    }
  }
  return undefined;
}

export function inferNumberToNumberOrDist(
  fn: Lambda,
  context: ReducerContext
): { domain: Domain; type: "Number" | "Dist" } | undefined {
  if (!fn.parameterCounts().includes(1)) {
    return undefined;
  }
  const useSig = lambdaToLambdaSignatures(fn).find((sig) => sig.length === 1);

  const includedDomain = useSig?.[0]?.domain;

  const xDomain = includedDomain
    ? includedDomain
    : new NumericRangeDomain(0.1, 10);

  const values = [xDomain.min, xDomain.max].map((point) =>
    point instanceof SDate ? vString(point.toString()) : vNumber(point)
  );

  const inferredType = getInferredType(fn, values, context);

  return (inferredType && { domain: xDomain, type: inferredType }) || undefined;
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
      .filter((d) => !d.isAssert)
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
        .filter((d) => !d.isAssert)
        .map(fnDefinitionToString)
        .map((def) => `  ${this.name}${def}\n`)
        .join("");
      return `There are function matches for ${this.name}(), but with different arguments:\n${defsString}`;
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
