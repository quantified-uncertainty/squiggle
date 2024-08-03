import { AnyExpressionIR } from "../../compiler/types.js";
import {
  REArgumentDomainError,
  REArityError,
  REDomainError,
} from "../../errors/messages.js";
import { tAny } from "../../types/Type.js";
import { Value } from "../../value/index.js";
import { VDomain } from "../../value/VDomain.js";
import { Reducer } from "../Reducer.js";
import { BaseLambda } from "./index.js";

export type UserDefinedLambdaParameter = {
  name: string;
  domain?: VDomain; // should this be Domain instead of VDomain?
};

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

  override inferOutputType() {
    return tAny(); // TODO
  }
}
