import { ReducerFn, vArray, vLambda, vRecord, vVoid, Value } from "../value";
import { Expression } from "../expression";
import * as Context from "./Context";
import { IError } from "./IError";
import { ImmutableMap } from "../utility/immutableMap";
import { Ok, result } from "../utility/result";
import * as Result from "../utility/result";
import { stdLib } from "../library";
import { defaultEnv } from "../dist/env";
import { parse } from "../ast/parse";
import { expressionFromAst } from "../ast/toExpression";
import { SquiggleLambda } from "./lambda";
import {
  ErrorMessage,
  REExpectedType,
  RENotAFunction,
  REOther,
  RESymbolNotFound,
} from "./ErrorMessage";

const throwFrom = (
  error: ErrorMessage,
  expression: Expression,
  context: Context.ReducerContext
): never => {
  throw IError.fromMessageWithFrameStack(
    error,
    context.frameStack.extend(
      Context.currentFunctionName(context),
      expression.ast.location
    )
  );
};

/*
  Recursively evaluate the expression
*/
export const evaluate: ReducerFn = (expression, context) => {
  // console.log(`reduce: ${expression->Reducer_Expression_T.toString}`)
  switch (expression.type) {
    case "Block": {
      let currentContext: Context.ReducerContext = {
        ...context,
        /*
        We could call `bindings.extend()` here, but we don't, since scopes are costly and bindings are immutable anyway.
        So we just have to be careful to throw away block's bindings at the end of a block scope and return the original context.
        Note: We'll have to remove this optimization if we add any kind of `locals()` (like in Python) function or debugging utilities.
        See also: similar note in `makeLambda()` function in `lambda.ts`.
        */
        // bindings: context.bindings.extend(),
      };
      let currentValue: Value = vVoid();
      for (const statement of expression.value) {
        [currentValue, currentContext] = evaluate(statement, currentContext);
      }
      return [currentValue, context]; // throw away block's context
    }

    case "Program": {
      // Js.log(`bindings: ${context.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      let currentContext = context;
      let currentValue: Value = vVoid();
      for (const statement of expression.value) {
        [currentValue, currentContext] = evaluate(statement, currentContext);
      }
      // Js.log(`bindings after: ${finalContext.bindings->Bindings.locals->Reducer_Namespace.toString}`)
      return [currentValue, currentContext];
    }

    case "Array": {
      const values = expression.value.map((element) => {
        const [value] = evaluate(element, context);
        return value;
      });
      return [vArray(values), context];
    }

    case "Record": {
      const value = vRecord(
        ImmutableMap(
          expression.value.map(([eKey, eValue]) => {
            const [key] = evaluate(eKey, context);
            if (key.type !== "String") {
              return throwFrom(
                REOther("Record keys must be strings"),
                expression,
                context
              );
            }
            const keyString: string = key.value;
            const [value] = evaluate(eValue, context);
            return [keyString, value];
          })
        )
      );
      return [value, context];
    }

    case "Assign": {
      const [result] = evaluate(expression.right, context);
      return [
        vVoid(),
        {
          ...context,
          bindings: context.bindings.set(expression.left, result),
        },
      ];
    }

    case "Symbol": {
      const name = expression.value;
      const value = context.bindings.get(name);
      if (value === undefined) {
        return throwFrom(
          RESymbolNotFound(expression.value),
          expression,
          context
        );
      } else {
        return [value, context];
      }
    }

    case "Value":
      return [expression.value, context];

    case "Ternary": {
      const [predicateResult] = evaluate(expression.condition, context);
      if (predicateResult.type === "Bool") {
        return evaluate(
          predicateResult.value ? expression.ifTrue : expression.ifFalse,
          context
        );
      } else {
        return throwFrom(REExpectedType("Boolean", ""), expression, context);
      }
    }

    case "Lambda": {
      return [
        vLambda(
          new SquiggleLambda(
            expression.name,
            expression.parameters,
            context.bindings,
            expression.body,
            expression.ast.location
          )
        ),
        context,
      ];
    }

    case "Call": {
      const [lambda] = evaluate(expression.fn, context);
      const argValues = expression.args.map((arg) => {
        const [argValue] = evaluate(arg, context);
        return argValue;
      });
      switch (lambda.type) {
        case "Lambda":
          const result = lambda.value.callFrom(
            argValues,
            context,
            evaluate,
            expression.ast.location // we have to pass the location of a current expression here, to put it on frameStack
          );
          return [result, context];
        default:
          return throwFrom(
            RENotAFunction(lambda.toString()),
            expression,
            context
          );
      }
    }
    default:
      throw new Error("Unreachable");
  }
};

const createDefaultContext = () => Context.createContext(stdLib, defaultEnv);

export const evaluateExpressionToResult = (
  expression: Expression
): result<Value, IError> => {
  const context = createDefaultContext();
  try {
    const [value] = evaluate(expression, context);
    return Ok(value);
  } catch (e) {
    return Result.Error(IError.fromException(e));
  }
};

export const evaluateStringToResult = (code: string): result<Value, IError> => {
  const exprR = Result.fmap(parse(code, "main"), expressionFromAst);

  return Result.bind(
    Result.errMap(exprR, IError.fromParseError),
    evaluateExpressionToResult
  );
};
