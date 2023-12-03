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
  RENotAFunction,
  REOther,
} from "../errors/messages.js";
import { compileAst } from "../expression/compile.js";
import { Expression } from "../expression/index.js";
import { getStdLib } from "../library/index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { annotationToDomain } from "../value/domain.js";
import {
  VDomain,
  Value,
  vArray,
  vDict,
  vDomain,
  vLambda,
  vVoid,
} from "../value/index.js";
import * as Context from "./context.js";
import { UserDefinedLambdaParameter, UserDefinedLambda } from "./lambda.js";

export type ReducerFn = (
  expression: Expression,
  context: Context.ReducerContext
) => [Value, Context.ReducerContext];

type SubReducerFn<T extends Expression["type"] = Expression["type"]> = (
  expressionValue: Extract<Expression, { type: T }>["value"],
  context: Context.ReducerContext,
  ast: ASTNode
) => [Value, Context.ReducerContext];

function throwFrom(
  error: ErrorMessage,
  context: Context.ReducerContext,
  ast: ASTNode
): never {
  throw IRuntimeError.fromMessageWithFrameStack(
    error,
    context.frameStack.extend(
      Context.currentFunctionName(context),
      ast.location
    )
  );
}

/*
 * Recursively evaluate the expression.
 * Don't call this function recursively! Call `context.evaluate` instead.
 * `context.evaluate` can inject additional behaviors, e.g. delay for pseudo-async evaluation.
 */
export const evaluate: ReducerFn = (expression, context) => {
  const ast = expression.ast;
  switch (expression.type) {
    case "Block":
      return evaluateBlock(expression.value, context, ast);
    case "Program":
      return evaluateProgram(expression.value, context, ast);
    case "Array":
      return evaluateArray(expression.value, context, ast);
    case "Dict":
      return evaluateDict(expression.value, context, ast);
    case "Assign":
      return evaluateAssign(expression.value, context, ast);
    case "ResolvedSymbol":
      return evaluateResolvedSymbol(expression.value, context, ast);
    case "Value":
      return evaluateValue(expression.value, context, ast);
    case "Ternary":
      return evaluateTernary(expression.value, context, ast);
    case "Lambda":
      return evaluateLambda(expression.value, context, ast);
    case "Call":
      return evaluateCall(expression.value, context, ast);
    default:
      throw new Error(`Unreachable: ${expression satisfies never}`);
  }
};

const evaluateBlock: SubReducerFn<"Block"> = (statements, context) => {
  /*
   * We could call `bindings.extend()` here, but we don't, since scopes are costly and bindings are immutable anyway.
   * So we just have to be careful to throw away block's bindings at the end of a block scope and return the original context.
   * Note: We'll have to remove this optimization if we add any kind of `locals()` (like in Python) function or debugging utilities.
   * See also: similar note in `UserDefinedLambda` constructor.
   */
  let currentContext = context;
  let currentValue: Value = vVoid();

  for (const statement of statements) {
    [currentValue, currentContext] = context.evaluate(
      statement,
      currentContext
    );
  }
  return [currentValue, context]; // throw away block's context
};

const evaluateProgram: SubReducerFn<"Program"> = (expressionValue, context) => {
  // Same as Block, but doesn't drop the context, so that we could return bindings and exports from it.
  let currentContext = context;
  let currentValue: Value = vVoid();

  for (const statement of expressionValue.statements) {
    [currentValue, currentContext] = context.evaluate(
      statement,
      currentContext
    );
  }
  return [currentValue, currentContext];
};

const evaluateArray: SubReducerFn<"Array"> = (expressionValue, context) => {
  const values = expressionValue.map((element) => {
    const [value] = context.evaluate(element, context);
    return value;
  });
  const value = vArray(values);
  return [value, context];
};

const evaluateDict: SubReducerFn<"Dict"> = (expressionValue, context, ast) => {
  const value = vDict(
    ImmutableMap(
      expressionValue.map(([eKey, eValue]) => {
        const [key] = context.evaluate(eKey, context);
        if (key.type !== "String") {
          return throwFrom(
            new REOther("Dict keys must be strings"),
            context,
            ast
          );
        }
        const keyString: string = key.value;
        const [value] = context.evaluate(eValue, context);
        return [keyString, value];
      })
    )
  );
  return [value, context];
};

const evaluateAssign: SubReducerFn<"Assign"> = (expressionValue, context) => {
  const [result] = context.evaluate(expressionValue.right, context);
  return [
    vVoid(),
    {
      // no spread is intentional - helps with monomorphism
      stack: context.stack.push(expressionValue.left, result),
      environment: context.environment,
      frameStack: context.frameStack,
      evaluate: context.evaluate,
      inFunction: context.inFunction,
    },
  ];
};

const evaluateResolvedSymbol: SubReducerFn<"ResolvedSymbol"> = (
  expressionValue,
  context
) => {
  const value = context.stack.get(expressionValue.offset);
  return [value, context];
};

const evaluateValue: SubReducerFn<"Value"> = (expressionValue, context) => {
  return [expressionValue, context];
};

const evaluateTernary: SubReducerFn<"Ternary"> = (
  expressionValue,
  context,
  ast
) => {
  const [predicateResult] = context.evaluate(
    expressionValue.condition,
    context
  );
  if (predicateResult.type !== "Bool") {
    return throwFrom(
      new REExpectedType("Boolean", predicateResult.type),
      context,
      ast
    );
  }

  const [value] = context.evaluate(
    predicateResult.value ? expressionValue.ifTrue : expressionValue.ifFalse,
    context
  );
  return [value, context];
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
      const [annotationValue] = context.evaluate(
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
          context.frameStack.extend(
            Context.currentFunctionName(context),
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
  const value = vLambda(
    new UserDefinedLambda(
      expressionValue.name,
      parameters,
      context.stack,
      expressionValue.body,
      ast.location
    )
  );
  return [value, context];
};

const evaluateCall: SubReducerFn<"Call"> = (expressionValue, context, ast) => {
  const [lambda] = context.evaluate(expressionValue.fn, context);
  const argValues = expressionValue.args.map((arg) => {
    const [argValue] = context.evaluate(arg, context);
    return argValue;
  });
  switch (lambda.type) {
    case "Lambda": {
      const result = lambda.value.callFrom(
        argValues,
        context,
        ast // we pass the ast of a current expression here, to put it on frameStack and in the resulting value
      );
      return [result, context];
    }
    default:
      return throwFrom(new RENotAFunction(lambda.toString()), context, ast);
  }
};

function createDefaultContext() {
  return Context.createContext(defaultEnv);
}

export async function evaluateExpressionToResult(
  expression: Expression
): Promise<result<Value, IRuntimeError>> {
  const context = createDefaultContext();
  try {
    const [value] = context.evaluate(expression, context);
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
