import jstat from "jstat";

import { ASTNode, parse } from "../ast/parse.js";
import { defaultEnv } from "../dist/env.js";
import {
  ICompileError,
  IRuntimeError,
  rethrowWithFrameStack,
} from "../errors/IError.js";
import {
  ErrorMessage,
  REExpectedType,
  RENotADecorator,
  RENotAFunction,
  REOther,
} from "../errors/messages.js";
import { compileAst } from "../expression/compile.js";
import { Expression, ExpressionByKind } from "../expression/index.js";
import { getStdLib } from "../library/index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { annotationToDomain } from "../value/domain.js";
import { Value } from "../value/index.js";
import { vArray } from "../value/VArray.js";
import { vDict } from "../value/VDict.js";
import { vDomain, VDomain } from "../value/VDomain.js";
import { vLambda } from "../value/vLambda.js";
import { vVoid } from "../value/VVoid.js";
import * as Context from "./context.js";
import { UserDefinedLambda, UserDefinedLambdaParameter } from "./lambda.js";
import { StackTrace } from "./stackTrace.js";

export type ReducerFn = (
  expression: Expression,
  context: Context.ReducerContext
) => Value;

type SubReducerFn<T extends Expression["kind"] = Expression["kind"]> = (
  expressionValue: ExpressionByKind<T>["value"],
  context: Context.ReducerContext,
  ast: ASTNode
) => Value;

function throwFrom(
  error: ErrorMessage,
  context: Context.ReducerContext,
  ast: ASTNode
): never {
  throw IRuntimeError.fromMessageWithStackTrace(
    error,
    new StackTrace(context.frameStack, ast.location)
  );
}

/*
 * Recursively evaluate the expression.
 * Don't call this function recursively! Call `context.evaluate` instead.
 * `context.evaluate` can inject additional behaviors, e.g. delay for pseudo-async evaluation.
 */
export const evaluate: ReducerFn = (expression, context) => {
  jstat.setRandom(context.rng);
  const ast = expression.ast;
  switch (expression.kind) {
    case "Call":
      return evaluateCall(expression.value, context, ast);
    case "StackRef":
      return evaluateStackRef(expression.value, context, ast);
    case "CaptureRef":
      return evaluateCaptureRef(expression.value, context, ast);
    case "Block":
      return evaluateBlock(expression.value, context, ast);
    case "Assign":
      return evaluateAssign(expression.value, context, ast);
    case "Array":
      return evaluateArray(expression.value, context, ast);
    case "Dict":
      return evaluateDict(expression.value, context, ast);
    case "Value":
      return evaluateValue(expression.value, context, ast);
    case "Ternary":
      return evaluateTernary(expression.value, context, ast);
    case "Lambda":
      return evaluateLambda(expression.value, context, ast);
    case "Program":
      return evaluateProgram(expression.value, context, ast);
    default:
      throw new Error(`Unreachable: ${expression satisfies never}`);
  }
};

const evaluateBlock: SubReducerFn<"Block"> = (statements, context) => {
  let currentValue: Value = vVoid();

  const initialStackSize = context.stack.size();
  for (const statement of statements) {
    currentValue = context.evaluate(statement, context);
  }
  context.stack.shrink(initialStackSize);

  return currentValue;
};

const evaluateProgram: SubReducerFn<"Program"> = (expressionValue, context) => {
  // Same as Block, but doesn't shrink back the stack, so that we could return bindings and exports from it.
  let currentValue: Value = vVoid();

  for (const statement of expressionValue.statements) {
    currentValue = context.evaluate(statement, context);
  }
  return currentValue;
};

const evaluateArray: SubReducerFn<"Array"> = (expressionValue, context) => {
  const values = expressionValue.map((element) => {
    return context.evaluate(element, context);
  });
  return vArray(values);
};

const evaluateDict: SubReducerFn<"Dict"> = (expressionValue, context, ast) => {
  return vDict(
    ImmutableMap(
      expressionValue.map(([eKey, eValue]) => {
        const key = context.evaluate(eKey, context);
        if (key.type !== "String") {
          return throwFrom(
            new REOther("Dict keys must be strings"),
            context,
            ast
          );
        }
        const keyString: string = key.value;
        const value = context.evaluate(eValue, context);
        return [keyString, value];
      })
    )
  );
};

const evaluateAssign: SubReducerFn<"Assign"> = (expressionValue, context) => {
  const result = context.evaluate(expressionValue.right, context);
  context.stack.push(result);
  return vVoid();
};

const evaluateStackRef: SubReducerFn<"StackRef"> = (
  expressionValue,
  context
) => {
  return context.stack.get(expressionValue);
};

const evaluateCaptureRef: SubReducerFn<"CaptureRef"> = (
  expressionValue,
  context
) => {
  const value = context.captures.at(expressionValue);
  if (!value) {
    throw new Error(`Internal error: invalid capture id ${expressionValue}`);
  }
  return value;
};

const evaluateValue: SubReducerFn<"Value"> = (expressionValue) => {
  return expressionValue;
};

const evaluateTernary: SubReducerFn<"Ternary"> = (
  expressionValue,
  context,
  ast
) => {
  const predicateResult = context.evaluate(expressionValue.condition, context);
  if (predicateResult.type !== "Bool") {
    return throwFrom(
      new REExpectedType("Boolean", predicateResult.type),
      context,
      ast
    );
  }

  return context.evaluate(
    predicateResult.value ? expressionValue.ifTrue : expressionValue.ifFalse,
    context
  );
};

const evaluateLambda: SubReducerFn<"Lambda"> = (
  expressionValue,
  context,
  ast
) => {
  const parameters: UserDefinedLambdaParameter[] = [];
  for (const parameterExpression of expressionValue.parameters) {
    let domain: VDomain | undefined;
    // Processing annotations, e.g. f(x: [3, 5]) = { ... }
    if (parameterExpression.annotation) {
      // First, we evaluate `[3, 5]` expression.
      const annotationValue = context.evaluate(
        parameterExpression.annotation,
        context
      );
      // Now we cast it to domain value, e.g. `NumericRangeDomain(3, 5)`.
      // Casting can fail, in which case we throw the error with a correct stacktrace.
      try {
        domain = vDomain(annotationToDomain(annotationValue));
      } catch (e) {
        // see also: `Lambda.callFrom`
        rethrowWithFrameStack(
          e,
          new StackTrace(
            context.frameStack,
            parameterExpression.annotation.ast.location
          )
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
    // duplicates `evaluateStackRef` and `evaluateCaptureRef`
    switch (capture.kind) {
      case "StackRef": {
        capturedValues.push(context.stack.get(capture.value));
        break;
      }
      case "CaptureRef": {
        const value = context.captures.at(capture.value);
        if (!value) {
          throw new Error(
            `Internal error: invalid capture id ${capture.value}`
          );
        }
        capturedValues.push(value);
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
      expressionValue.body,
      ast.location
    )
  );
};

const evaluateCall: SubReducerFn<"Call"> = (expressionValue, context, ast) => {
  const lambda = context.evaluate(expressionValue.fn, context);
  if (lambda.type !== "Lambda") {
    throwFrom(new RENotAFunction(lambda.toString()), context, ast);
  }
  if (expressionValue.as === "decorate" && !lambda.value.isDecorator) {
    throwFrom(new RENotADecorator(lambda.toString()), context, ast);
  }

  const argValues = expressionValue.args.map((arg) => {
    const argValue = context.evaluate(arg, context);
    return argValue;
  });
  return lambda.value.callFrom(
    argValues,
    context,
    ast // we pass the ast of a current expression here, to put it on frameStack
  );
};

function createDefaultContext() {
  return Context.createContext(defaultEnv);
}

export async function evaluateExpressionToResult(
  expression: Expression
): Promise<result<Value, IRuntimeError>> {
  const context = createDefaultContext();
  try {
    const value = context.evaluate(expression, context);
    return Ok(value);
  } catch (e) {
    return Result.Err(IRuntimeError.fromException(e));
  }
}

export async function evaluateStringToResult(
  code: string
): Promise<result<Value, ICompileError | IRuntimeError>> {
  const exprR = Result.bind(parse(code, "main"), (ast) =>
    compileAst(ast, getStdLib())
  );

  if (exprR.ok) {
    return await evaluateExpressionToResult(exprR.value);
  } else {
    return Result.Err(exprR.value);
  }
}
