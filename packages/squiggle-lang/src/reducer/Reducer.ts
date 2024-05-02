import jstat from "jstat";

import { ASTNode, LocationRange } from "../ast/parse.js";
import { Env } from "../dists/env.js";
import { IRuntimeError } from "../errors/IError.js";
import {
  ErrorMessage,
  REArgumentDomainError,
  REExpectedType,
  RENotADecorator,
  RENotAFunction,
  REOther,
} from "../errors/messages.js";
import { Expression, ExpressionByKind } from "../expression/index.js";
import { getAleaRng, PRNG } from "../rng/index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import { annotationToDomain } from "../value/annotations.js";
import { Value, vArray, vDict, vLambda, vVoid } from "../value/index.js";
import { vDomain, VDomain } from "../value/VDomain.js";
import { FrameStack } from "./FrameStack.js";
import {
  Lambda,
  UserDefinedLambda,
  UserDefinedLambdaParameter,
} from "./lambda.js";
import { Stack } from "./Stack.js";
import { StackTrace } from "./StackTrace.js";

type ExpressionValue<Kind extends Expression["kind"]> =
  ExpressionByKind<Kind>["value"];

/**
 * Checks that all `evaluateFoo` methods follow the same the convention.
 *
 * Note: unfortunately, it's not possible to reuse method signatures. Don't try
 * `evaluateFoo: EvalutateAllKinds["Foo"] = () => ...`, it's a bad idea because
 * arrow functions shouldn't be used as methods.
 */
type EvaluateAllKinds = {
  [Kind in Expression["kind"] as `evaluate${Kind}`]: (
    expressionValue: ExpressionValue<Kind>,
    ast: ASTNode
  ) => Value;
};

export class Reducer implements EvaluateAllKinds {
  readonly environment: Readonly<Env>;

  readonly stack: Stack;
  readonly frameStack: FrameStack;

  readonly rng: PRNG;

  constructor(environment: Env) {
    this.environment = environment;

    this.stack = Stack.make();
    this.frameStack = FrameStack.make();

    const seed = environment.seed
      ? String(environment.seed)
      : String(Math.random());

    this.rng = getAleaRng(seed);
  }

  // Recursively evaluate the expression.
  // TODO - separate "internal loop evaluate" and "public entrypoint evaluate" methods?
  evaluate(expression: Expression): Value {
    jstat.setRandom(this.rng); // TODO - roll back at the end
    switch (expression.kind) {
      case "Call":
        return this.evaluateCall(expression.value, expression.ast);
      case "StackRef":
        return this.evaluateStackRef(expression.value);
      case "CaptureRef":
        return this.evaluateCaptureRef(expression.value);
      case "Block":
        return this.evaluateBlock(expression.value);
      case "Assign":
        return this.evaluateAssign(expression.value);
      case "Array":
        return this.evaluateArray(expression.value);
      case "Dict":
        return this.evaluateDict(expression.value);
      case "Value":
        return this.evaluateValue(expression.value);
      case "Ternary":
        return this.evaluateTernary(expression.value);
      case "Lambda":
        return this.evaluateLambda(expression.value);
      case "Program":
        return this.evaluateProgram(expression.value);
      default:
        throw new Error(`Unreachable: ${expression satisfies never}`);
    }
  }

  // This method is mostly useful in the reducer code.
  // In Stdlib, it's fine to throw ErrorMessage instances, they'll be upgraded to errors with stack traces automatically.
  private runtimeError(error: ErrorMessage, ast: ASTNode) {
    return IRuntimeError.fromMessage(
      error,
      StackTrace.make(this.frameStack, ast.location)
    );
  }

  // This method is useful if you called `reducer.evaluate` and got an exception.
  // The exception will be annotated with the current frameStack, even if it occured somewhere in JS.
  // You can also attach an optional location to the stacktrace.
  errorFromException(e: unknown, location?: LocationRange) {
    return IRuntimeError.fromException(
      e,
      StackTrace.make(this.frameStack, location)
    );
  }

  evaluateBlock(statements: Expression[]) {
    const initialStackSize = this.stack.size();

    let currentValue: Value = vVoid();
    for (const statement of statements) {
      currentValue = this.evaluate(statement);
    }

    this.stack.shrink(initialStackSize);
    return currentValue;
  }

  evaluateProgram(expressionValue: ExpressionValue<"Program">) {
    // Same as Block, but doesn't shrink back the stack, so that we could return bindings and exports from it.
    let currentValue: Value = vVoid();

    for (const statement of expressionValue.statements) {
      currentValue = this.evaluate(statement);
    }
    return currentValue;
  }

  evaluateArray(expressionValue: ExpressionValue<"Array">) {
    const values = expressionValue.map((element) => {
      return this.evaluate(element);
    });
    return vArray(values);
  }

  evaluateDict(expressionValue: ExpressionValue<"Dict">) {
    return vDict(
      ImmutableMap(
        expressionValue.map(([eKey, eValue]) => {
          const key = this.evaluate(eKey);
          if (key.type !== "String") {
            throw this.runtimeError(
              new REOther("Dict keys must be strings"),
              eKey.ast
            );
          }
          const keyString: string = key.value;
          const value = this.evaluate(eValue);
          return [keyString, value];
        })
      )
    );
  }

  evaluateAssign(expressionValue: ExpressionValue<"Assign">) {
    const result = this.evaluate(expressionValue.right);
    this.stack.push(result);
    return vVoid();
  }

  evaluateStackRef(expressionValue: ExpressionValue<"StackRef">) {
    return this.stack.get(expressionValue);
  }

  private getCapture(id: number) {
    // This might seem relatively slow, but it works faster than when we stored captures in the Reducer object.
    const topFrame = this.frameStack.getTopFrame();
    if (!topFrame) {
      throw new Error(
        `Internal error: can't reference a capture when not in a function`
      );
    }
    const value = topFrame.lambda.captures.at(id);
    if (!value) {
      throw new Error(`Internal error: invalid capture id ${id}`);
    }
    return value;
  }

  evaluateCaptureRef(id: ExpressionValue<"CaptureRef">) {
    return this.getCapture(id);
  }

  evaluateValue(value: Value) {
    return value;
  }

  evaluateTernary(expressionValue: ExpressionValue<"Ternary">) {
    const predicateResult = this.evaluate(expressionValue.condition);
    if (predicateResult.type !== "Bool") {
      throw this.runtimeError(
        new REExpectedType("Boolean", predicateResult.type),
        expressionValue.condition.ast
      );
    }

    return this.evaluate(
      predicateResult.value ? expressionValue.ifTrue : expressionValue.ifFalse
    );
  }

  evaluateLambda(expressionValue: ExpressionValue<"Lambda">) {
    const parameters: UserDefinedLambdaParameter[] = [];
    for (const parameterExpression of expressionValue.parameters) {
      let domain: VDomain | undefined;
      // Processing annotations, e.g. f(x: [3, 5]) = { ... }
      if (parameterExpression.annotation) {
        // First, we evaluate `[3, 5]` expression.
        const annotationValue = this.evaluate(parameterExpression.annotation);
        // Now we cast it to domain value, e.g. `NumericRangeDomain(3, 5)`.
        // Casting can fail, in which case we throw the error with a correct stacktrace.
        try {
          domain = vDomain(annotationToDomain(annotationValue));
        } catch (e) {
          // see also: `Lambda.callFrom`
          throw this.errorFromException(
            e,
            parameterExpression.annotation.ast.location
          );
        }
      }
      parameters.push({
        name: parameterExpression.name,
        domain,
      });
    }

    const capturedValues: Value[] = [];
    for (const capture of expressionValue.captures) {
      // identical to `evaluateStackRef` and `evaluateCaptureRef`
      switch (capture.kind) {
        case "StackRef": {
          capturedValues.push(this.stack.get(capture.value));
          break;
        }
        case "CaptureRef": {
          capturedValues.push(this.getCapture(capture.value));
          break;
        }
        default:
          throw new Error(`Impossible capture ${capture satisfies never}`);
      }
    }

    return vLambda(
      new UserDefinedLambda(
        expressionValue.name,
        capturedValues,
        parameters,
        expressionValue.body
      )
    );
  }

  evaluateCall(expressionValue: ExpressionValue<"Call">, ast: ASTNode) {
    const lambda = this.evaluate(expressionValue.fn);
    if (lambda.type !== "Lambda") {
      throw this.runtimeError(
        new RENotAFunction(lambda.toString()),
        expressionValue.fn.ast
      );
    }
    if (expressionValue.as === "decorate" && !lambda.value.isDecorator) {
      throw this.runtimeError(
        new RENotADecorator(lambda.toString()),
        expressionValue.fn.ast
      );
    }

    const argValues = expressionValue.args.map((arg) => this.evaluate(arg));

    // we pass the ast of a current expression here, to put it on frameStack
    try {
      return this.call(lambda.value, argValues, ast);
    } catch (e) {
      if (e instanceof REArgumentDomainError) {
        // Function is still on frame stack, remove it.
        // (This is tightly coupled with lambda implementations.)
        this.frameStack.pop();
        throw this.runtimeError(e, expressionValue.args.at(e.idx)?.ast ?? ast);
      } else {
        throw e;
      }
    }
  }

  call(lambda: Lambda, args: Value[], ast?: ASTNode) {
    return lambda.call(args, this, ast?.location);
  }
}
