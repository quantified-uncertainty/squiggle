import { ASTNode, parse } from "../ast/parse.js";
import { expressionFromAst } from "../expression/fromAst.js";
import { defaultEnv } from "../dist/env.js";
import { Expression } from "../expression/index.js";
import { stdLib } from "../library/index.js";
import { ImmutableMap } from "../utility/immutableMap.js";
import * as Result from "../utility/result.js";
import { Ok, result } from "../utility/result.js";
import { Value, vArray, vLambda, vRecord, vVoid } from "../value/index.js";
import {
  ErrorMessage,
  REExpectedType,
  RENotAFunction,
  REOther,
  RESymbolNotFound,
} from "./ErrorMessage.js";
import { IError } from "./IError.js";
import * as Context from "./context.js";
import { SquiggleLambda } from "./lambda.js";

export type ReducerFn<T extends Expression["type"] = Expression["type"]> = (
  expression: Extract<Expression, { type: T }>,
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
  throw IError.fromMessageWithFrameStack(
    error,
    context.frameStack.extend(
      Context.currentFunctionName(context),
      ast.location
    )
  );
}

/*
  Recursively evaluate the expression
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
    case "Record":
      return evaluateRecord(expression.value, context, ast);
    case "Assign":
      return evaluateAssign(expression.value, context, ast);
    case "Symbol":
      return evaluateSymbol(expression.value, context, ast);
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
   * See also: similar note in `SquiggleLambda` constructor.
   */
  let currentContext = context;
  let currentValue: Value = vVoid();

  for (const statement of statements) {
    [currentValue, currentContext] = evaluate(statement, currentContext);
  }
  return [currentValue, context]; // throw away block's context
};

const evaluateProgram: SubReducerFn<"Program"> = (statements, context) => {
  // Same as Block, but doesn't drop the context, so that we could return bindings from it.
  let currentContext = context;
  let currentValue: Value = vVoid();

  for (const statement of statements) {
    [currentValue, currentContext] = evaluate(statement, currentContext);
  }
  return [currentValue, currentContext];
};

const evaluateArray: SubReducerFn<"Array"> = (expressionValue, context) => {
  const values = expressionValue.map((element) => {
    const [value] = evaluate(element, context);
    return value;
  });
  return [vArray(values), context];
};

const evaluateRecord: SubReducerFn<"Record"> = (
  expressionValue,
  context,
  ast
) => {
  const value = vRecord(
    ImmutableMap(
      expressionValue.map(([eKey, eValue]) => {
        const [key] = evaluate(eKey, context);
        if (key.type !== "String") {
          return throwFrom(
            new REOther("Record keys must be strings"),
            context,
            ast
          );
        }
        const keyString: string = key.value;
        const [value] = evaluate(eValue, context);
        return [keyString, value];
      })
    )
  );
  return [value, context];
};

const evaluateAssign: SubReducerFn<"Assign"> = (expressionValue, context) => {
  const [result] = evaluate(expressionValue.right, context);
  return [
    vVoid(),
    {
      ...context,
      bindings: context.bindings.set(expressionValue.left, result),
    },
  ];
};

const evaluateSymbol: SubReducerFn<"Symbol"> = (name, context, ast) => {
  const value = context.bindings.get(name);
  if (value === undefined) {
    return throwFrom(new RESymbolNotFound(name), context, ast);
  } else {
    return [value, context];
  }
};

const evaluateValue: SubReducerFn<"Value"> = (
  expressionValue,
  context,
  ast
) => {
  return [expressionValue, context];
};

const evaluateTernary: SubReducerFn<"Ternary"> = (
  expressionValue,
  context,
  ast
) => {
  const [predicateResult] = evaluate(expressionValue.condition, context);
  if (predicateResult.type === "Bool") {
    return evaluate(
      predicateResult.value ? expressionValue.ifTrue : expressionValue.ifFalse,
      context
    );
  } else {
    return throwFrom(new REExpectedType("Boolean", ""), context, ast);
  }
};

const evaluateLambda: SubReducerFn<"Lambda"> = (
  expressionValue,
  context,
  ast
) => {
  return [
    vLambda(
      new SquiggleLambda(
        expressionValue.name,
        expressionValue.parameters,
        context.bindings,
        expressionValue.body,
        ast.location
      )
    ),
    context,
  ];
};

const evaluateCall: SubReducerFn<"Call"> = (expressionValue, context, ast) => {
  const [lambda] = evaluate(expressionValue.fn, context);
  const argValues = expressionValue.args.map((arg) => {
    const [argValue] = evaluate(arg, context);
    return argValue;
  });
  switch (lambda.type) {
    case "Lambda":
      const result = lambda.value.callFrom(
        argValues,
        context,
        evaluate,
        ast.location // we have to pass the location of a current expression here, to put it on frameStack
      );
      return [result, context];
    default:
      return throwFrom(new RENotAFunction(lambda.toString()), context, ast);
  }
};

function createDefaultContext() {
  return Context.createContext(stdLib, defaultEnv);
}

export function evaluateExpressionToResult(
  expression: Expression
): result<Value, IError> {
  const context = createDefaultContext();
  try {
    const [value] = evaluate(expression, context);
    return Ok(value);
  } catch (e) {
    return Result.Err(IError.fromException(e));
  }
}

export function evaluateStringToResult(code: string): result<Value, IError> {
  const exprR = Result.fmap(parse(code, "main"), expressionFromAst);

  return Result.bind(
    Result.errMap(exprR, IError.fromParseError),
    evaluateExpressionToResult
  );
}
